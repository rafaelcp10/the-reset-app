-- Cada inegociável ocupa um slot fixo (0, 1 ou 2) dentro da semana do
-- usuário — necessário para poder fazer upsert por slot ao definir/editar
-- um inegociável da semana.
alter table compromissos
  add constraint compromissos_usuario_semana_ordem_key
  unique (usuario_id, semana_inicio, ordem);
