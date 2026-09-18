-- Nutrição: os números do dia, e a água.
--
-- A conta de calorias e macros é a da planilha do Rafael, replicada como
-- está (ver lib/saude/nutricao.ts). Ela precisa de uma coisa que o app
-- nunca perguntou: o biotipo. Ele multiplica o metabolismo basal por 1,0,
-- 1,2 ou 1,4 — sem ele não há conta, e não há padrão razoável para chutar.
--
-- Nada aqui é meta que o app cobra. A aba mostra os três números do dia
-- (descanso, treino, treino e corrida) e diz qual deles é o de hoje. Não
-- registra o que foi comido, não tem barra de caloria e não dá nota.
alter table usuarios
  add column if not exists biotipo text,
  -- Os dois denominadores da planilha: proteína por quilo de massa magra,
  -- gordura por quilo de peso total. Ficam editáveis porque são escolha de
  -- quem monta a dieta, não constante da natureza.
  add column if not exists proteina_g_kg numeric(4, 2),
  add column if not exists gordura_g_kg numeric(4, 2),
  -- A corrida o app não registra: fica o padrão que a pessoa declara.
  add column if not exists corrida_km numeric(5, 2),
  -- Tamanho da garrafa. É ele que transforma "3,1 litros" em "4 garrafas",
  -- que é a única forma dessa conta ser útil em pé na cozinha.
  add column if not exists garrafa_ml smallint;

alter table usuarios drop constraint if exists usuarios_biotipo_check;
alter table usuarios
  add constraint usuarios_biotipo_check check (
    biotipo is null or biotipo in ('ectomorfo', 'mesomorfo', 'endomorfo')
  );

alter table usuarios drop constraint if exists usuarios_garrafa_ml_check;
alter table usuarios
  add constraint usuarios_garrafa_ml_check check (
    garrafa_ml is null or (garrafa_ml >= 100 and garrafa_ml <= 5000)
  );

-- Quanta água em cada dia, em mililitros.
--
-- Guardado em ml, e não em garrafas: trocar de garrafa não pode reescrever
-- o passado. Uma linha por dia — beber de novo soma, não empilha linha.
create table agua (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  ml integer not null default 0 check (ml >= 0),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, data)
);

create index agua_usuario_data_idx on agua (usuario_id, data desc);

alter table agua enable row level security;

create policy "agua_self" on agua for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
