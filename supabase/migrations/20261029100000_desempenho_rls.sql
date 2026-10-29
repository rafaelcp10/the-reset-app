-- Desempenho do banco: RLS e índices repetidos (2026-10-29).
--
-- 1. As políticas passam a usar `(select auth.uid())` em vez de `auth.uid()`.
--    É a recomendação do próprio Supabase (o linter chama de
--    `auth_rls_initplan`): sem o `select`, o Postgres pode reavaliar a função
--    a cada linha examinada; com ele, avalia uma vez por consulta e reusa.
--    Quem enxerga o quê não muda nada — a expressão é a mesma.
--
--    `alter policy`, e não apagar e recriar: a política nunca deixa de
--    existir, nem por um instante, então não há janela sem proteção.
--
--    As duas políticas do storage (gravações e fotos) ficam como estão: são
--    consultadas raramente, e ali o ganho não paga o risco de mexer.
--
-- 2. Saem três índices que repetiam a restrição `unique` das mesmas colunas.
--    O `unique (usuario_id, data)` já cria um índice nessas colunas, e o
--    Postgres lê um índice nos dois sentidos — o `data desc` de dois deles
--    não ajudava em nada. Índice repetido só custa: cada gravação nessas
--    tabelas atualizava os dois.

alter policy "usuarios_self" on usuarios
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter policy "frases_self" on frases
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "compromissos_self" on compromissos
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "dias_self" on dias
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "compromissos_dia_self" on compromissos_dia
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "revisoes_semanais_self" on revisoes_semanais
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "musicas_self" on musicas
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "inscricoes_push_self" on inscricoes_push
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "gravacoes_self" on gravacoes
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "tarefas_self" on tarefas
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "tarefas_dia_self" on tarefas_dia
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "treinos_self" on treinos
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "exercicios_self" on exercicios
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "registros_exercicio_self" on registros_exercicio
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "sessoes_treino_self" on sessoes_treino
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "medidas_self" on medidas
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "fotos_evolucao_self" on fotos_evolucao
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "agua_self" on agua
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "movimentos_self" on movimentos
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

alter policy "lembretes_enviados_self" on lembretes_enviados
  using ((select auth.uid()) = usuario_id);

drop index if exists dias_usuario_data_idx;
drop index if exists medidas_usuario_data_idx;
drop index if exists agua_usuario_data_idx;
