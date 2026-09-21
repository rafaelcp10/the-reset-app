-- Série variável: a repetição e a carga mudam de uma série para a outra.
--
-- Até aqui um exercício era "N séries de M repetições": três números e
-- pronto. Isso não descreve metade do que se faz na academia — 12, 10, 8 e
-- 6 repetições, subindo a carga a cada série que encurta.
--
-- `repeticoes_serie` no plano guarda {12,10,8,6}. **Nulo quer dizer "todas
-- iguais"**, e é o que toda linha existente continua sendo: nada precisa
-- ser migrado, e nenhum exercício que já existe muda de comportamento.
--
-- No registro, `repeticoes_serie` guarda o que de fato foi feito e
-- `cargas_serie` a carga de cada série. Os dois nulos é o registro de
-- sempre: uma carga, uma repetição, N séries.
alter table exercicios
  add column if not exists repeticoes_serie smallint[];

alter table registros_exercicio
  add column if not exists repeticoes_serie smallint[],
  add column if not exists cargas_serie numeric(6, 2)[];
