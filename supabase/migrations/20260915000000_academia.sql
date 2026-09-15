-- Academia: os moldes de treino, os exercícios dentro deles e a memória
-- de carga que torna a progressão possível.
--
-- O app não monta treino nem tem plano pronto: a pessoa escreve os seus,
-- como já escreve as frases e os inegociáveis. O que ele faz — e o que
-- ninguém faz de cabeça — é lembrar a carga da última vez e propor o
-- degrau seguinte. Confirmar ou corrigir continua sendo dela.
--
-- `registros_exercicio` já entra aqui, embora só seja usada na fase
-- seguinte, para o script ser rodado uma vez só.

alter table usuarios
  add column if not exists treino_local text,
  add column if not exists treino_minutos smallint,
  add column if not exists treino_limitacoes text[] not null default '{}',
  add column if not exists academia_configurada_em timestamptz;

alter table usuarios drop constraint if exists usuarios_treino_local_check;
alter table usuarios
  add constraint usuarios_treino_local_check check (
    treino_local is null or treino_local in ('casa', 'academia', 'hibrido')
  );

-- Um molde: "A — Puxar", que cai em certos dias da semana.
-- `dias_semana` usa o mesmo formato das tarefas recorrentes (0 = domingo)
-- de propósito: mesma gramática, mesmo código de leitura.
create table treinos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  nome text not null,
  dias_semana smallint[] not null default '{}',
  ordem smallint not null default 0,
  criado_em timestamptz not null default now()
);
create index treinos_usuario_idx on treinos (usuario_id, ordem);

-- O degrau vive no exercício, não numa configuração global: 2,5 kg é uma
-- anilha de cada lado na barra, mas halter e máquina sobem em passos
-- diferentes, e quem sabe qual é a pessoa que levanta.
create table exercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  treino_id uuid not null references treinos (id) on delete cascade,
  nome text not null,
  grupo text,
  series smallint not null default 3,
  repeticoes smallint not null default 10,
  incremento_kg numeric(5, 2) not null default 2.5,
  ordem smallint not null default 0,
  criado_em timestamptz not null default now()
);
create index exercicios_treino_idx on exercicios (treino_id, ordem);

-- A memória. Uma linha por exercício por dia — refazer o mesmo exercício
-- no mesmo dia corrige o registro em vez de criar um segundo.
create table registros_exercicio (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  exercicio_id uuid not null references exercicios (id) on delete cascade,
  data date not null,
  carga_kg numeric(6, 2),
  repeticoes smallint,
  series smallint,
  criado_em timestamptz not null default now(),
  unique (exercicio_id, data)
);
create index registros_exercicio_usuario_data_idx
  on registros_exercicio (usuario_id, data);

alter table treinos enable row level security;
alter table exercicios enable row level security;
alter table registros_exercicio enable row level security;

create policy "treinos_self" on treinos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "exercicios_self" on exercicios for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "registros_exercicio_self" on registros_exercicio for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
