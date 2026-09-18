-- Foto de antes e depois, na aba Evolução.
--
-- É a única imagem do app, e é exceção escrita: ver o próprio corpo em duas
-- fotos diz o que 3,99 pontos percentuais não dizem. Não é ilustração, não
-- é decoração, não é conteúdo do produto — é dado do usuário, como a voz
-- gravada nas frases.
--
-- Por isso segue exatamente o tratamento das gravações, que é o mais
-- restrito que o app tem: bucket privado, pasta por usuário, leitura só por
-- URL assinada de vida curta, e apagada junto com a conta. Foto de corpo é
-- o dado mais sensível que este app guarda; aqui não há margem para errar.
create table fotos_evolucao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  caminho text not null,
  criado_em timestamptz not null default now(),
  -- Uma por dia: tirar de novo corrige, não empilha. Mesma decisão das
  -- medidas e dos registros de carga.
  unique (usuario_id, data)
);

create index fotos_evolucao_usuario_data_idx
  on fotos_evolucao (usuario_id, data desc);

alter table fotos_evolucao enable row level security;

create policy "fotos_evolucao_self" on fotos_evolucao for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- Bucket privado. Nunca público, em nenhuma hipótese.
insert into storage.buckets (id, name, public)
values ('fotos-evolucao', 'fotos-evolucao', false)
on conflict (id) do nothing;

-- Cada usuário só enxerga a própria pasta: fotos-evolucao/<uid>/<data>.jpg
create policy "fotos_evolucao_storage_self" on storage.objects for all
  using (
    bucket_id = 'fotos-evolucao'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'fotos-evolucao'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
