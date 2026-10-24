-- Notificações que escalam.
--
-- Até aqui, cada disparo do cron carregava **todos** os usuários para o
-- JavaScript, filtrava ali quem estava no horário, mandava a lista de ids
-- na URL das consultas seguintes (que estoura com algumas centenas de
-- pessoas no mesmo horário), lia o histórico inteiro de dias e avisos de
-- cada um, e disparava todos os envios ao mesmo tempo numa função só, que
-- marcava "avisado" no fim — cortada no meio, reenviava tudo no disparo
-- seguinte. Com um usuário funcionava; com milhares, não.
--
-- O desenho novo:
--
-- 1. **O banco decide quem recebe**, com a conta de fuso feita aqui, e
--    devolve só quem está no horário agora.
-- 2. **E reserva o aviso na mesma operação**, antes de enviar: a reserva é
--    a linha em `lembretes_enviados`, cuja chave (pessoa, dia, tipo) já
--    existia. Duas execuções simultâneas não conseguem reservar a mesma
--    pessoa — `on conflict do nothing` é a trava —, então duplicata fica
--    impossível por construção, e não por cuidado.
-- 3. **Em lotes**: cada chamada devolve no máximo `p_lote` pessoas. A
--    função do app envia o lote, pede o próximo, e para quando acaba o
--    tempo dela; o resto fica para o minuto seguinte.
--
-- Reservar antes de enviar troca "pode chegar duas vezes" por "pode não
-- chegar" se a função morrer entre a reserva e o envio. Para lembrete é a
-- troca certa: um aviso perdido custa menos que dois iguais. Falha
-- passageira do serviço de push devolve a reserva (`liberar_lembretes`),
-- e o minuto seguinte tenta de novo, dentro do teto de atraso.
--
-- **O relógio é calculado uma vez por fuso, e não uma vez por pessoa.**
-- Cem mil pessoas dividem algumas dezenas de fusos, e a conversão de fuso
-- é a parte cara: feita por pessoa, a água levava 5 segundos com 100 mil
-- usuários num teste; feita por fuso, cabe com folga num minuto. Pelo
-- mesmo motivo, cada função descarta primeiro os fusos fora de hora e só
-- depois olha pessoas.
--
-- Toda função recebe `p_agora`, com padrão `now()`, para os testes poderem
-- simular qualquer hora do dia em qualquer fuso.

-- O dia do app vira às 3h, não à meia-noite (`dataRitual` em
-- lib/ritual/tempo.ts). As duas contas precisam andar juntas.
create or replace function dia_ritual(p_fuso text, p_agora timestamptz default now())
returns date
language sql stable
as $$
  select ((p_agora at time zone p_fuso) - interval '3 hours')::date
$$;

-- Minutos passados desde as 3h, no relógio do fuso. Contar a partir das 3h
-- é o que faz um check-in de 21h30 com o cron rodando à 1h dar "passaram
-- 3h30", e não "faltam 20 horas". (Era `minutosDesde`, em lib/push/janela.ts,
-- quando a conta ainda era feita no app.)
create or replace function minutos_desde_as_tres(p_fuso text, p_agora timestamptz default now())
returns int
language sql stable
as $$
  select ((extract(hour from (p_agora at time zone p_fuso))::int - 3 + 24) % 24) * 60
    + extract(minute from (p_agora at time zone p_fuso))::int
$$;

-- A mesma régua para um horário marcado: 21h30 fica a 1110 minutos das 3h.
create or replace function minutos_do_horario(p_hora int, p_minuto int)
returns int
language sql immutable
as $$
  select ((p_hora - 3 + 24) % 24) * 60 + p_minuto
$$;

-- Em toda função abaixo, `fusos` é lido uma vez por consulta: fuso
-- inválido vira UTC em vez de derrubar a consulta — `at time zone` com um
-- nome que não existe dá erro, e um usuário com fuso estragado não pode
-- calar o aviso de todos os outros.

-- ---------------------------------------------------------------- check-in

create or replace function reivindicar_checkin(
  p_lote int default 500,
  p_teto int default 180,
  p_agora timestamptz default now()
)
returns table (usuario_id uuid, data date, linha_do_dia text)
language sql volatile
as $$
  with fusos as materialized (select name from pg_timezone_names),
  base as (
    select
      u.id,
      case when u.fuso in (select name from fusos) then u.fuso else 'UTC' end as fuso,
      minutos_do_horario(
        extract(hour from u.horario_checkin)::int,
        extract(minute from u.horario_checkin)::int
      ) as alvo
    from usuarios u
    where u.lembrete_ativo
      and u.horario_checkin is not null
      -- Sem aparelho inscrito não há a quem avisar, e reservar mesmo assim
      -- marcaria como avisado quem nunca recebeu nada.
      and exists (select 1 from inscricoes_push i where i.usuario_id = u.id)
  ),
  relogio as materialized (
    select f.fuso, dia_ritual(f.fuso, p_agora) as dia, minutos_desde_as_tres(f.fuso, p_agora) as agora
    from (select distinct fuso from base) f
  ),
  candidatos as (
    select b.id, r.dia, r.agora - b.alvo as atraso
    from base b
    join relogio r on r.fuso = b.fuso
    where r.agora - b.alvo between 0 and p_teto
  ),
  pendentes as (
    select c.id, c.dia
    from candidatos c
    -- Quem já respondeu hoje não é lembrado: o app nunca cobra duas vezes.
    where not exists (
            select 1 from dias d
            where d.usuario_id = c.id and d.data = c.dia and d.feito is not null
          )
      and not exists (
            select 1 from lembretes_enviados l
            where l.usuario_id = c.id and l.data = c.dia and l.tipo = 'checkin'
          )
    -- Mais atrasado primeiro. Com fila maior que o lote, ordem arbitrária
    -- podia deixar a mesma pessoa para trás minuto após minuto até passar
    -- do teto — e aí ela não recebia nada.
    order by c.atraso desc
    limit p_lote
  ),
  reservados as (
    insert into lembretes_enviados (usuario_id, data, tipo, enviado_em)
    select id, dia, 'checkin', p_agora from pendentes
    on conflict do nothing
    returning lembretes_enviados.usuario_id, lembretes_enviados.data
  )
  select r.usuario_id, r.data, d.linha_do_dia
  from reservados r
  left join dias d on d.usuario_id = r.usuario_id and d.data = r.data
$$;

-- ------------------------------------------------------- fita e foto, às 9h

create or replace function reivindicar_evolucao(
  p_lote int default 500,
  p_teto int default 180,
  p_agora timestamptz default now()
)
returns table (usuario_id uuid, data date, medir boolean, fotografar boolean)
language sql volatile
as $$
  with fusos as materialized (select name from pg_timezone_names),
  base as (
    select
      u.id,
      case when u.fuso in (select name from fusos) then u.fuso else 'UTC' end as fuso
    from usuarios u
    where u.lembrete_ativo
      and exists (select 1 from inscricoes_push i where i.usuario_id = u.id)
  ),
  -- Só os fusos em que agora está entre 9h e 9h + teto. Os outros saem
  -- antes de qualquer consulta por pessoa.
  relogio as materialized (
    select
      f.fuso,
      dia_ritual(f.fuso, p_agora) as dia,
      minutos_desde_as_tres(f.fuso, p_agora) - minutos_do_horario(9, 0) as atraso
    from (select distinct fuso from base) f
    where minutos_desde_as_tres(f.fuso, p_agora) - minutos_do_horario(9, 0)
          between 0 and p_teto
  ),
  avaliados as (
    select
      b.id,
      r.dia,
      r.atraso,
      -- Fita: domingo, e seis dias ou mais desde a última. O interruptor é
      -- ter medido alguma vez — quem nunca mediu nunca é lembrado.
      (extract(dow from r.dia) = 0
        and f.ultima is not null
        and r.dia - f.ultima >= 6) as medir,
      -- Foto: um mês a partir da última, e não do calendário. Dia 31 mais um
      -- mês vira o último dia do mês seguinte, como em `somarMesesISO`.
      (p.ultima is not null
        and r.dia >= (p.ultima + interval '1 month')::date) as fotografar
    from base b
    join relogio r on r.fuso = b.fuso
    left join lateral (
      select max(m.data) as ultima from medidas m
      where m.usuario_id = b.id and m.cintura_cm is not null
    ) f on true
    left join lateral (
      select max(fe.data) as ultima from fotos_evolucao fe
      where fe.usuario_id = b.id
    ) p on true
    where not exists (
      select 1 from lembretes_enviados l
      where l.usuario_id = b.id and l.data = r.dia and l.tipo = 'evolucao'
    )
  ),
  pendentes as (
    select * from avaliados where medir or fotografar
    order by atraso desc
    limit p_lote
  ),
  reservados as (
    insert into lembretes_enviados (usuario_id, data, tipo, enviado_em)
    select id, dia, 'evolucao', p_agora from pendentes
    on conflict do nothing
    returning lembretes_enviados.usuario_id, lembretes_enviados.data
  )
  select r.usuario_id, r.data, p.medir, p.fotografar
  from reservados r
  join pendentes p on p.id = r.usuario_id
$$;

-- ------------------------------------------------------------------- água

create or replace function reivindicar_agua(
  p_lote int default 500,
  p_teto int default 120,
  p_agora timestamptz default now()
)
returns table (usuario_id uuid, data date, faltam_garrafas int, tipo text)
language sql volatile
as $$
  with fusos as materialized (select name from pg_timezone_names),
  base as (
    select
      u.id,
      case when u.fuso in (select name from fusos) then u.fuso else 'UTC' end as fuso,
      u.garrafa_ml
    from usuarios u
    where u.lembrete_ativo
      -- O interruptor da água é ter dito o tamanho da garrafa.
      and u.garrafa_ml is not null
      and exists (select 1 from inscricoes_push i where i.usuario_id = u.id)
  ),
  horas(h) as (values (8), (11), (14), (17), (20)),
  relogio as materialized (
    select f.fuso, dia_ritual(f.fuso, p_agora) as dia, minutos_desde_as_tres(f.fuso, p_agora) as agora
    from (select distinct fuso from base) f
  ),
  -- Da água vale só o **último** horário vencido: perdidos os das 8h e das
  -- 11h, sai um aviso às 14h, e não três de uma vez. Tudo isso depende só
  -- do fuso, então é decidido aqui, antes de olhar pessoa por pessoa.
  agua_no_fuso as materialized (
    select
      r.fuso,
      r.dia,
      v.vencidas,
      v.vencidas[array_upper(v.vencidas, 1)] as ultima,
      r.agora - minutos_do_horario(v.vencidas[array_upper(v.vencidas, 1)], 0) as atraso
    from relogio r
    cross join lateral (
      select array_agg(h order by h) as vencidas
      from horas
      where r.agora - minutos_do_horario(h, 0) >= 0
    ) v
    where v.vencidas is not null
      and r.agora - minutos_do_horario(v.vencidas[array_upper(v.vencidas, 1)], 0) <= p_teto
  ),
  avaliados as (
    select
      b.id,
      a.dia,
      a.vencidas,
      a.ultima,
      a.atraso,
      b.garrafa_ml,
      -- 35 ml por quilo, arredondado aos 50 ml (`metaDeAgua`).
      round(pz.peso * 35 / 50) * 50 as meta,
      coalesce(ag.ml, 0) as bebido
    from base b
    join agua_no_fuso a on a.fuso = b.fuso
    join lateral (
      select m.peso_kg as peso from medidas m
      where m.usuario_id = b.id and m.peso_kg is not null
      order by m.data desc
      limit 1
    ) pz on true
    left join agua ag on ag.usuario_id = b.id and ag.data = a.dia
    where not exists (
            select 1 from lembretes_enviados l
            where l.usuario_id = b.id and l.data = a.dia and l.tipo = 'agua_' || a.ultima
          )
      -- Fita ou foto acabou de chegar: a água espera. Dois banners no
      -- mesmo minuto é o caminho mais curto para desligar tudo.
      and not exists (
            select 1 from lembretes_enviados l
            where l.usuario_id = b.id and l.tipo = 'evolucao'
              and l.enviado_em > p_agora - interval '60 minutes'
          )
  ),
  pendentes as (
    -- Batida a meta, o lembrete cala pelo resto do dia.
    select * from avaliados where meta > 0 and bebido < meta
    order by atraso desc
    limit p_lote
  ),
  reservados as (
    -- Reserva também os horários que passaram sem aviso: um lembrete das
    -- 8h entregue às 19h não ajuda, e deixá-lo aberto só empilharia atraso.
    insert into lembretes_enviados (usuario_id, data, tipo, enviado_em)
    select p.id, p.dia, 'agua_' || h, p_agora
    from pendentes p, unnest(p.vencidas) as h
    on conflict do nothing
    returning lembretes_enviados.usuario_id, lembretes_enviados.data, lembretes_enviados.tipo
  )
  -- Só sai aviso para quem esta execução reservou o horário **atual**: se
  -- outra execução chegou antes nele, é dela o envio.
  select
    r.usuario_id,
    r.data,
    ceil((p.meta - p.bebido)::numeric / p.garrafa_ml)::int,
    r.tipo
  from reservados r
  join pendentes p on p.id = r.usuario_id and r.tipo = 'agua_' || p.ultima
$$;

-- ------------------------------------------------------ apoio ao envio

-- Pelo corpo da requisição, e não pela URL: a lista de ids na URL estoura
-- com algumas centenas de pessoas.
create or replace function inscricoes_de(p_usuarios uuid[])
returns table (usuario_id uuid, endpoint text, chaves jsonb)
language sql stable
as $$
  select i.usuario_id, i.endpoint, i.chaves
  from inscricoes_push i
  where i.usuario_id = any (p_usuarios)
$$;

create or replace function remover_inscricoes(p_endpoints text[])
returns int
language sql volatile
as $$
  with apagadas as (
    delete from inscricoes_push where endpoint = any (p_endpoints) returning 1
  )
  select count(*)::int from apagadas
$$;

-- Devolve reservas de quem não recebeu por falha passageira do serviço de
-- push, para o minuto seguinte tentar de novo.
create or replace function liberar_lembretes(p_itens jsonb)
returns int
language sql volatile
as $$
  with apagadas as (
    delete from lembretes_enviados l
    using jsonb_to_recordset(p_itens) as x(usuario_id uuid, data date, tipo text)
    where l.usuario_id = x.usuario_id and l.data = x.data and l.tipo = x.tipo
    returning 1
  )
  select count(*)::int from apagadas
$$;

-- --------------------------------------------------------------- registro

-- Uma linha por execução de cada rota, inclusive as que não mandaram nada:
-- é o batimento cardíaco. Os 36 dias sem notificação, de setembro a
-- outubro de 2026, passaram sem ninguém ver porque não existia isto.
create table if not exists execucoes_cron (
  id bigint generated always as identity primary key,
  rota text not null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  reservados int not null default 0,
  enviados int not null default 0,
  falhas int not null default 0,
  removidas int not null default 0,
  erro text
);

create index if not exists execucoes_cron_rota_inicio_idx
  on execucoes_cron (rota, inicio desc);

-- Sem política nenhuma: só a chave de serviço lê e escreve.
alter table execucoes_cron enable row level security;

-- A água pergunta se houve fita ou foto na última hora, por `enviado_em`.
create index if not exists lembretes_enviados_recentes_idx
  on lembretes_enviados (usuario_id, enviado_em desc);

-- -------------------------------------------------------------- acesso

-- O Supabase dá execução de função nova para `anon` e `authenticated` por
-- padrão. Estas devolvem dados de outras pessoas e marcam avisos de todo
-- mundo: só a chave de serviço, usada pelas rotas de cron, pode chamá-las.
revoke execute on function
  reivindicar_checkin(int, int, timestamptz),
  reivindicar_evolucao(int, int, timestamptz),
  reivindicar_agua(int, int, timestamptz),
  inscricoes_de(uuid[]),
  remover_inscricoes(text[]),
  liberar_lembretes(jsonb)
from public, anon, authenticated;

grant execute on function
  reivindicar_checkin(int, int, timestamptz),
  reivindicar_evolucao(int, int, timestamptz),
  reivindicar_agua(int, int, timestamptz),
  inscricoes_de(uuid[]),
  remover_inscricoes(text[]),
  liberar_lembretes(jsonb)
to service_role;
