-- O aviso de treino esquecido aberto.
--
-- Treino começado e não encerrado ficava aberto até o próximo treino, e a
-- duração virava 23, 72, 118 horas — 8 de 23 sessões do Rafael em outubro
-- de 2026. Com 1h40 aberto (o tempo vem da rota), sai um aviso perguntando
-- se o treino já acabou, que abre a sessão com o "Encerrar" na frente.
--
-- Um aviso por treino, e não por dia: a reserva em `lembretes_enviados`
-- usa o tipo `treino_aberto_<id da sessão>`. Dois treinos no mesmo dia,
-- os dois esquecidos, recebem um aviso cada.
--
-- O teto (6 horas depois do horário do aviso, ou seja, até 7h40 de treino
-- aberto) existe para um treino aberto há dias não ser lembrado de
-- madrugada por um cron que voltou a funcionar: passou disso, o
-- aviso já não ajuda — e o fechamento usa a última série de qualquer
-- jeito (`fimDeVerdade`, em lib/saude/sessao.ts).
--
-- Mesmo desenho dos outros avisos: o banco escolhe e reserva na mesma
-- operação, e só a chave de serviço executa.

create or replace function reivindicar_treino_aberto(
  p_lote int default 500,
  p_minutos int default 100,
  p_teto int default 360,
  p_agora timestamptz default now()
)
returns table (
  usuario_id uuid,
  data date,
  sessao_id uuid,
  treino_id uuid,
  treino_nome text,
  inicio timestamptz
)
language sql volatile
as $$
  with abertas as (
    select s.id, s.usuario_id, s.data, s.treino_id, s.inicio
    from sessoes_treino s
    join usuarios u on u.id = s.usuario_id
    where s.fim is null
      and s.treino_id is not null
      and u.lembrete_ativo
      and p_agora - s.inicio >= make_interval(mins => p_minutos)
      and p_agora - s.inicio <= make_interval(mins => p_minutos + p_teto)
      and exists (select 1 from inscricoes_push i where i.usuario_id = s.usuario_id)
      and not exists (
        select 1 from lembretes_enviados l
        where l.usuario_id = s.usuario_id
          and l.data = s.data
          and l.tipo = 'treino_aberto_' || s.id
      )
    order by s.inicio
    limit p_lote
  ),
  reservados as (
    insert into lembretes_enviados (usuario_id, data, tipo, enviado_em)
    select a.usuario_id, a.data, 'treino_aberto_' || a.id, p_agora from abertas a
    on conflict do nothing
    returning lembretes_enviados.usuario_id, lembretes_enviados.data, lembretes_enviados.tipo
  )
  select a.usuario_id, a.data, a.id, a.treino_id, t.nome, a.inicio
  from reservados r
  join abertas a on r.tipo = 'treino_aberto_' || a.id
  join treinos t on t.id = a.treino_id
$$;

-- A sessão aberta é a consulta mais frequente aqui; o índice da tela já
-- existe (`sessoes_treino_aberta_idx`), mas por usuário. Este é por
-- início, entre as abertas.
create index if not exists sessoes_treino_abertas_inicio_idx
  on sessoes_treino (inicio)
  where fim is null;

revoke execute on function reivindicar_treino_aberto(int, int, int, timestamptz)
  from public, anon, authenticated;
grant execute on function reivindicar_treino_aberto(int, int, int, timestamptz)
  to service_role;
