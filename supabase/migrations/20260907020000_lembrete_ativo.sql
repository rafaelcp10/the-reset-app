-- Preferência de Ajustes: se o lembrete noturno (push) deve ser enviado.
-- O envio em si (VAPID/push) ainda não está implementado — esta coluna só
-- guarda a preferência do usuário pra quando existir.
alter table usuarios
  add column lembrete_ativo boolean not null default true;
