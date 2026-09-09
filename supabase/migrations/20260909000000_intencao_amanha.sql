-- A ponte entre a noite e a manhã seguinte.
--
-- No check-in noturno a pessoa pode dizer o que vem amanhã. Isso não é a
-- linha de amanhã ainda — é uma intenção, guardada na linha de HOJE. De
-- manhã o Espelho lê a intenção de ontem e a oferece como primeira opção,
-- para a escolha continuar sendo uma escolha.
--
-- Coluna separada de propósito: gravar direto em linha_do_dia de amanhã
-- faria a decisão parecer tomada antes de a pessoa acordar.
alter table dias
  add column if not exists intencao_amanha text;
