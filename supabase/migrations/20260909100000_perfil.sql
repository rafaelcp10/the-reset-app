-- Perfil da pessoa, coletado uma vez, depois do onboarding.
--
-- Altura, peso e meta existem para a aba Academia. Ficam guardados como
-- dado, não como placar: o app não calcula IMC, não mostra percentual de
-- progresso e não compara ninguém com ninguém (ver CLAUDE.md).
alter table usuarios
  add column if not exists nome text,
  add column if not exists nascimento date,
  add column if not exists altura_cm smallint,
  add column if not exists peso_kg numeric(5, 2),
  add column if not exists meta_saude text,
  add column if not exists perfil_completo_em timestamptz;

alter table usuarios
  drop constraint if exists usuarios_meta_saude_check;

alter table usuarios
  add constraint usuarios_meta_saude_check check (
    meta_saude is null
    or meta_saude in ('perder_peso', 'ganhar_massa', 'manter', 'saude_geral')
  );
