-- A sessão de treino: quando começou e quando terminou.
--
-- Precisa viver no banco, e não no aparelho, porque o cronômetro tem que
-- sobreviver ao app sendo fechado no meio do treino — que é exatamente o
-- que acontece quando alguém guarda o celular entre uma série e outra.
--
-- Sem restrição de unicidade: fazer o mesmo treino duas vezes no mesmo dia
-- é raro, mas é assunto de quem treina, não do banco. O que o código
-- garante é que só existe uma sessão aberta (`fim is null`) por vez.
create table sessoes_treino (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  treino_id uuid not null references treinos (id) on delete cascade,
  data date not null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  criado_em timestamptz not null default now()
);

create index sessoes_treino_usuario_data_idx
  on sessoes_treino (usuario_id, data desc);

-- Achar a sessão aberta é a consulta mais frequente da tela.
create index sessoes_treino_aberta_idx
  on sessoes_treino (usuario_id)
  where fim is null;

alter table sessoes_treino enable row level security;

create policy "sessoes_treino_self" on sessoes_treino for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
