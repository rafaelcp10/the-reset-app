-- Completar o Espelho (respiração + 5 frases) é um evento distinto da
-- confirmação noturna (Fiz/Não fiz) — a Home precisa saber se o ritual de
-- hoje já foi feito, independente do check-in da noite.
alter table dias
  add column espelho_feito_em timestamptz;
