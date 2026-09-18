-- Medidas corporais, para a aba Evolução.
--
-- A conta de percentual de gordura é a da planilha do Rafael: o método da
-- Marinha americana por circunferências, com o ajuste de +2 pontos no
-- masculino que a planilha aplica. Ela precisa de fita métrica e mais
-- nada — é o que permite fazer em casa, semana a semana.
--
-- As medidas guardam a altura junto em vez de buscá-la no perfil: editar a
-- altura no perfil recalcularia todo o passado, e passado não se recalcula.
--
-- Uma linha por dia: medir de novo corrige, não empilha. Mesma decisão dos
-- registros de carga, pelo mesmo motivo.
--
-- Sem meta, sem faixa de "ideal", sem classificação. O app guarda o que a
-- fita disse e devolve a série; quem julga o número é quem se mediu.
create table medidas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  peso_kg numeric(5, 2),
  altura_cm smallint,
  pescoco_cm numeric(4, 1),
  cintura_cm numeric(4, 1),
  -- Só entra na conta feminina. Fica nulo no resto.
  quadril_cm numeric(4, 1),
  criado_em timestamptz not null default now(),
  unique (usuario_id, data)
);

create index medidas_usuario_data_idx on medidas (usuario_id, data desc);

alter table medidas enable row level security;

create policy "medidas_self" on medidas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- A fórmula tem dois ramos, e o ramo feminino usa o quadril. Sem isso não
-- dá para calcular — e o onboarding nunca perguntou, porque até agora nada
-- no app dependia disso.
alter table usuarios add column if not exists sexo text;

alter table usuarios drop constraint if exists usuarios_sexo_check;
alter table usuarios
  add constraint usuarios_sexo_check check (
    sexo is null or sexo in ('masculino', 'feminino')
  );
