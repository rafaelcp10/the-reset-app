-- O histórico mora no exercício, e não no treino.
--
-- Até aqui o registro de carga apontava para o exercício com `on delete
-- cascade`, e o exercício apontava para o treino com `on delete cascade`.
-- Apagar o "Pull" para montar uma série nova apagava junto todo o
-- histórico de carga dos exercícios dele — e as sessões de treino, que são
-- a contagem de semanas com treino. É exatamente o que acontece quando a
-- série muda a cada três meses, que é o normal de quem treina.
--
-- Três mudanças:
--
-- 1. `movimentos` é a biblioteca de exercícios da pessoa. "Supino reto com
--    barra" é um movimento só, esteja ele em quantos treinos estiver, hoje
--    ou daqui a seis meses. `exercicios` passa a ser a vaga do movimento
--    dentro de um treino (séries, repetições, degrau, ordem).
-- 2. O registro aponta para o movimento. A vaga pode sumir; o histórico
--    fica. E a regra "um registro por exercício por dia" passa a valer por
--    movimento, que é o que ela sempre quis dizer.
-- 3. A sessão de treino sobrevive ao treino apagado.
-- 4. O movimento guarda o último plano (degrau, séries, repetições): a vaga
--    em que ele estava some junto com a série velha, e o supino que volta
--    daqui a seis meses tem que voltar com o degrau que a pessoa usava.
--
-- O mesmo movimento é o mesmo nome, sem diferença de maiúscula, acento ou
-- espaço sobrando — a `chave`. O app calcula a mesma chave em
-- `lib/saude/movimento.ts`; as duas contas precisam andar juntas.
--
-- Tudo numa transação: se qualquer passo falhar, nada muda.

begin;

create or replace function chave_movimento(nome text) returns text
language sql immutable as $$
  select btrim(regexp_replace(lower(translate(nome,
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
    'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')), '\s+', ' ', 'g'))
$$;

create table if not exists movimentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  nome text not null,
  chave text not null,
  grupo text,
  criado_em timestamptz not null default now(),
  unique (usuario_id, chave)
);

alter table movimentos
  add column if not exists incremento_kg numeric(5, 2),
  add column if not exists series smallint,
  add column if not exists repeticoes smallint,
  add column if not exists repeticoes_serie smallint[];

alter table movimentos enable row level security;
drop policy if exists "movimentos_self" on movimentos;
create policy "movimentos_self" on movimentos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

alter table exercicios
  add column if not exists movimento_id uuid references movimentos (id) on delete cascade;
alter table registros_exercicio
  add column if not exists movimento_id uuid references movimentos (id) on delete cascade;

-- Cada nome que já existe vira um movimento. Com o mesmo nome em dois
-- treinos, fica o nome e o grupo do mais antigo.
insert into movimentos (usuario_id, nome, chave, grupo, criado_em)
select distinct on (usuario_id, chave_movimento(nome))
  usuario_id, btrim(nome), chave_movimento(nome), grupo, criado_em
from exercicios
order by usuario_id, chave_movimento(nome), criado_em
on conflict (usuario_id, chave) do nothing;

update exercicios e
set movimento_id = m.id
from movimentos m
where e.movimento_id is null
  and m.usuario_id = e.usuario_id
  and m.chave = chave_movimento(e.nome);

update registros_exercicio r
set movimento_id = e.movimento_id
from exercicios e
where r.movimento_id is null
  and e.id = r.exercicio_id;

-- O plano de cada movimento é o da vaga mais recente dele.
update movimentos m
set incremento_kg = e.incremento_kg,
    series = e.series,
    repeticoes = e.repeticoes,
    repeticoes_serie = e.repeticoes_serie
from (
  select distinct on (movimento_id)
    movimento_id, incremento_kg, series, repeticoes, repeticoes_serie
  from exercicios
  order by movimento_id, criado_em desc
) e
where e.movimento_id = m.id
  and m.incremento_kg is null;

alter table exercicios alter column movimento_id set not null;
alter table registros_exercicio alter column movimento_id set not null;

-- Apagar a vaga não apaga o histórico: o registro perde a vaga e fica com
-- o movimento. As restrições antigas são achadas pelo que fazem, e não
-- pelo nome, para não depender do nome que o Postgres escolheu.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute a
      on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
    where con.conrelid = 'registros_exercicio'::regclass
      and a.attname = 'exercicio_id'
      and con.contype in ('f', 'u')
  loop
    execute format('alter table registros_exercicio drop constraint %I', c.conname);
  end loop;

  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute a
      on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
    where con.conrelid = 'sessoes_treino'::regclass
      and a.attname = 'treino_id'
      and con.contype = 'f'
  loop
    execute format('alter table sessoes_treino drop constraint %I', c.conname);
  end loop;
end $$;

alter table registros_exercicio alter column exercicio_id drop not null;
alter table registros_exercicio
  add constraint registros_exercicio_exercicio_id_fkey
  foreign key (exercicio_id) references exercicios (id) on delete set null;

alter table registros_exercicio
  add constraint registros_exercicio_movimento_data_key
  unique (movimento_id, data);

create index if not exists registros_exercicio_movimento_idx
  on registros_exercicio (movimento_id, data desc);
create index if not exists exercicios_movimento_idx
  on exercicios (movimento_id);

-- A sessão sobrevive ao treino apagado: é ela que conta as semanas com
-- treino, e a série nova não pode zerar a presença da antiga.
alter table sessoes_treino alter column treino_id drop not null;
alter table sessoes_treino
  add constraint sessoes_treino_treino_id_fkey
  foreign key (treino_id) references treinos (id) on delete set null;

commit;
