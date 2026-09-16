-- Manhã, tarde e noite entram no lugar das faixas de peso.
--
-- As duas respondiam à mesma pergunta — em que ordem o dia acontece — e
-- duas respostas para a mesma pergunta na mesma tela é exatamente o que
-- este app não faz. Período ganha porque é concreto: "de manhã" é um fato
-- do dia, "primeiro" era uma opinião sobre ele.
--
-- Nulo é um estado legítimo: tarefa sem hora marcada não some, aparece num
-- grupo próprio no fim da lista. A lição do item recorrente sem dia.
alter table tarefas
  add column if not exists periodo text;

alter table tarefas drop constraint if exists tarefas_periodo_check;
alter table tarefas
  add constraint tarefas_periodo_check check (
    periodo is null or periodo in ('manha', 'tarde', 'noite')
  );

create index if not exists tarefas_usuario_periodo_idx
  on tarefas (usuario_id, periodo);

-- O peso sai junto com a faixa. A coluna tem um dia de vida e some com o
-- que estiver nela; deixar coluna morta no banco é dívida que ninguém paga.
alter table tarefas drop column if exists peso;
drop index if exists tarefas_usuario_peso_idx;
