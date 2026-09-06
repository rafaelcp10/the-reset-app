-- The Reset — modelo de dados inicial

create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  horario_checkin time,
  fuso text,
  reps_padrao integer,
  modo_maos_livres boolean not null default false,
  criado_em timestamptz not null default now()
);

create table frases (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  funcao text not null check (
    funcao in ('identidade', 'seguranca', 'como_falo', 'palavra', 'ritmo')
  ),
  texto text not null,
  preenchimento_lacuna text,
  versao integer not null default 1,
  criado_em timestamptz not null default now()
);
create index frases_usuario_id_idx on frases (usuario_id);

create table compromissos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  semana_inicio date not null,
  texto text not null,
  ordem integer not null default 0
);
create index compromissos_usuario_semana_idx on compromissos (usuario_id, semana_inicio);

-- feito é nulo até o check-in noturno; false é "não fiz", um registro
-- válido, não a ausência de registro (ver CLAUDE.md: falhar não zera nada)
create table dias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  linha_do_dia text,
  feito boolean,
  registrado_em timestamptz,
  unique (usuario_id, data)
);
create index dias_usuario_data_idx on dias (usuario_id, data);

create table compromissos_dia (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  compromisso_id uuid not null references compromissos (id) on delete cascade,
  data date not null,
  feito boolean,
  unique (compromisso_id, data)
);
create index compromissos_dia_usuario_data_idx on compromissos_dia (usuario_id, data);

create table revisoes_semanais (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  semana_inicio date not null,
  como_estou text,
  criado_em timestamptz not null default now(),
  unique (usuario_id, semana_inicio)
);

create table musicas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  url text not null,
  nome text,
  ordem integer not null default 0
);
create index musicas_usuario_id_idx on musicas (usuario_id);

create table inscricoes_push (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  endpoint text not null unique,
  chaves jsonb not null
);
create index inscricoes_push_usuario_id_idx on inscricoes_push (usuario_id);

-- RLS: os dados são pessoais (ver CLAUDE.md, seção Privacidade) — cada
-- usuário só pode ler/escrever as próprias linhas.
alter table usuarios enable row level security;
alter table frases enable row level security;
alter table compromissos enable row level security;
alter table dias enable row level security;
alter table compromissos_dia enable row level security;
alter table revisoes_semanais enable row level security;
alter table musicas enable row level security;
alter table inscricoes_push enable row level security;

create policy "usuarios_self" on usuarios for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "frases_self" on frases for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "compromissos_self" on compromissos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "dias_self" on dias for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "compromissos_dia_self" on compromissos_dia for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "revisoes_semanais_self" on revisoes_semanais for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "musicas_self" on musicas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "inscricoes_push_self" on inscricoes_push for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
