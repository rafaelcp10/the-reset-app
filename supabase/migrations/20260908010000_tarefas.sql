-- To-do. Três tipos, e a diferença entre eles é só quando o item aparece:
--   recorrente → nos dias da semana escolhidos
--   semana     → fica em "Esta semana" até ser feito
--   data       → num dia específico
--
-- Os inegociáveis NÃO moram aqui: continuam em `compromissos`, definidos
-- no Ritual de domingo. São coisas diferentes de propósito.
create table tarefas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  texto text not null,
  tipo text not null default 'semana' check (
    tipo in ('recorrente', 'semana', 'data')
  ),
  -- 0 = domingo … 6 = sábado. Só vale para tipo 'recorrente'.
  dias_semana smallint[] not null default '{}',
  -- Só vale para tipo 'data'.
  data date,
  -- Item "da semana" que a pessoa puxou para um dia. Se a data passar sem
  -- ele ser feito, volta sozinho para "Esta semana" — em silêncio, sem
  -- marca de atraso (ver CLAUDE.md: falhar não zera nada).
  puxado_para date,
  criado_em timestamptz not null default now()
);
create index tarefas_usuario_idx on tarefas (usuario_id);

-- A existência da linha é a marcação. Não existe "não fiz" para tarefa:
-- ausência é ausência, sem rótulo negativo e sem cor de alerta.
create table tarefas_dia (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  tarefa_id uuid not null references tarefas (id) on delete cascade,
  data date not null,
  unique (tarefa_id, data)
);
create index tarefas_dia_usuario_data_idx on tarefas_dia (usuario_id, data);

alter table tarefas enable row level security;
alter table tarefas_dia enable row level security;

create policy "tarefas_self" on tarefas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "tarefas_dia_self" on tarefas_dia for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
