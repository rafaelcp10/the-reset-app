-- Peso corporal ao longo do tempo.
--
-- O perfil já guarda um `peso_kg`, mas ele é um retrato: vale o dia em que
-- foi digitado e some quando você digita outro. Evolução precisa de série,
-- não de retrato — a pergunta é "como eu comecei e como eu estou", e ela
-- não tem resposta com um número só.
--
-- Uma linha por dia: pesar de novo no mesmo dia corrige, não empilha. É a
-- mesma decisão dos registros de carga, pelo mesmo motivo.
--
-- Sem meta, sem percentual, sem faixa de "ideal". O app registra o que
-- aconteceu; quem julga o número é quem subiu na balança.
create table medidas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  peso_kg numeric(5, 2),
  criado_em timestamptz not null default now(),
  unique (usuario_id, data)
);

create index medidas_usuario_data_idx on medidas (usuario_id, data desc);

alter table medidas enable row level security;

create policy "medidas_self" on medidas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
