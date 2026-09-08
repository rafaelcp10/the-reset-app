-- Gravação de voz por frase: uma por função, sempre sobrescrita.
-- O áudio fica no Storage; aqui guardamos só o ponteiro e o tipo, porque
-- a extensão varia por navegador (webm/opus no Android, mp4 no iOS).
create table gravacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  funcao text not null check (
    funcao in ('identidade', 'seguranca', 'como_falo', 'palavra', 'ritmo')
  ),
  caminho text not null,
  mime text not null,
  criado_em timestamptz not null default now(),
  unique (usuario_id, funcao)
);
create index gravacoes_usuario_id_idx on gravacoes (usuario_id);

alter table gravacoes enable row level security;

create policy "gravacoes_self" on gravacoes for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- Bucket privado: a voz do usuário nunca fica em URL pública (CLAUDE.md,
-- seção Privacidade). A leitura acontece só por signed URL de curta duração.
insert into storage.buckets (id, name, public)
values ('gravacoes', 'gravacoes', false)
on conflict (id) do nothing;

-- Cada usuário só enxerga a própria pasta: gravacoes/<uid>/<funcao>.<ext>
create policy "gravacoes_storage_self" on storage.objects for all
  using (
    bucket_id = 'gravacoes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'gravacoes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
