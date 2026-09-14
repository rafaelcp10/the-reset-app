-- Peso da tarefa: o que vem primeiro, o que vem depois, o que vai se sobrar.
--
-- Três faixas nomeadas, e não um número de 1 a 5. Número lê como nota, e
-- nota é placar (ver CLAUDE.md). O que faz a prioridade significar alguma
-- coisa não é a escala: é o teto de três em "primeiro", que o app aplica.
-- Sem teto, todo item vira prioritário e a faixa deixa de informar — é o
-- que acontece com o P1 de quem usa escala livre.
--
-- 'depois' é o padrão porque é onde uma tarefa recém-escrita realmente
-- está: nem prometida para já, nem descartada.
alter table tarefas
  add column peso text not null default 'depois'
  check (peso in ('primeiro', 'depois', 'se_sobrar'));

-- A lista é lida por faixa a cada abertura do To-do.
create index tarefas_usuario_peso_idx on tarefas (usuario_id, peso);
