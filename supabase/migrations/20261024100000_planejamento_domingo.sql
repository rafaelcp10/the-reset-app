-- O lembrete de domingo: planejar a semana.
--
-- No app a semana começa no domingo, e a revisão de domingo
-- (`/ritual/domingo`) fecha a semana que acabou e decide os inegociáveis
-- da que começa. Fechar grava uma linha em `revisoes_semanais` com a
-- semana **passada** — é ela que diz "esta pessoa já planejou", e quem já
-- planejou não é lembrado.
--
-- Mesmo desenho dos outros avisos (migration
-- `20261024000000_notificacoes_escalaveis.sql`): o banco escolhe quem está
-- no horário e reserva o aviso na mesma operação, com o relógio calculado
-- uma vez por fuso.
--
-- A hora vem da rota (`p_hora`, 10h), e não daqui: mudar o horário não
-- pode exigir migration. 10h porque a fita sai às 9h, também no domingo, e
-- dois avisos no mesmo minuto é o caminho mais curto para desligar tudo.
-- O teto é largo (6 horas) porque planejar às 15h ainda serve.

create or replace function reivindicar_planejamento(
  p_lote int default 500,
  p_hora int default 10,
  p_teto int default 360,
  p_agora timestamptz default now()
)
returns table (usuario_id uuid, data date)
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
  -- Só os fusos em que hoje é domingo e já passou da hora, dentro do teto.
  relogio as materialized (
    select
      f.fuso,
      dia_ritual(f.fuso, p_agora) as dia,
      minutos_desde_as_tres(f.fuso, p_agora) - minutos_do_horario(p_hora, 0) as atraso
    from (select distinct fuso from base) f
    where extract(dow from dia_ritual(f.fuso, p_agora)) = 0
      and minutos_desde_as_tres(f.fuso, p_agora) - minutos_do_horario(p_hora, 0)
          between 0 and p_teto
  ),
  pendentes as (
    select b.id, r.dia
    from base b
    join relogio r on r.fuso = b.fuso
    -- Já fechou a semana que acabou: não precisa ser lembrado.
    where not exists (
            select 1 from revisoes_semanais rs
            where rs.usuario_id = b.id and rs.semana_inicio = r.dia - 7
          )
      and not exists (
            select 1 from lembretes_enviados l
            where l.usuario_id = b.id and l.data = r.dia and l.tipo = 'planejamento'
          )
      -- Fita ou foto acabou de chegar: o planejamento espera.
      and not exists (
            select 1 from lembretes_enviados l
            where l.usuario_id = b.id and l.tipo = 'evolucao'
              and l.enviado_em > p_agora - interval '60 minutes'
          )
    order by r.atraso desc
    limit p_lote
  ),
  reservados as (
    insert into lembretes_enviados (usuario_id, data, tipo, enviado_em)
    select id, dia, 'planejamento', p_agora from pendentes
    on conflict do nothing
    returning lembretes_enviados.usuario_id, lembretes_enviados.data
  )
  select r.usuario_id, r.data from reservados r
$$;

revoke execute on function reivindicar_planejamento(int, int, int, timestamptz)
  from public, anon, authenticated;
grant execute on function reivindicar_planejamento(int, int, int, timestamptz)
  to service_role;
