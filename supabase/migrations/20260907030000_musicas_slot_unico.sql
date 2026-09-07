-- Cada faixa ocupa um slot fixo (0 a 4) — até 5 músicas por usuário,
-- necessário pra poder fazer upsert por slot na tela "Minhas músicas".
alter table musicas
  add constraint musicas_usuario_ordem_key
  unique (usuario_id, ordem);
