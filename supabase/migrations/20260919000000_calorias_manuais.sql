-- Calorias escritas à mão, por tipo de dia.
--
-- A conta sugere; quem conhece o próprio corpo corrige. O Rafael sabe que
-- perde gordura com 2.200 num dia de treino, e a sugestão dava 2.525 —
-- nenhuma fórmula sabe disso, e discutir com quem já testou é o caminho
-- mais curto para a pessoa parar de olhar o número.
--
-- Nulo quer dizer "use a sugestão". É o que faz o botão de redefinir ser
-- uma linha de código em vez de uma cópia do valor calculado: redefinir é
-- voltar a nulo, e a partir daí o alvo volta a acompanhar peso, treino e
-- objetivo sozinho.
alter table usuarios
  add column if not exists calorias_descanso smallint,
  add column if not exists calorias_treino smallint,
  add column if not exists calorias_treino_corrida smallint;

alter table usuarios drop constraint if exists usuarios_calorias_check;
alter table usuarios
  add constraint usuarios_calorias_check check (
    (calorias_descanso is null or calorias_descanso between 800 and 10000)
    and (calorias_treino is null or calorias_treino between 800 and 10000)
    and (
      calorias_treino_corrida is null
      or calorias_treino_corrida between 800 and 10000
    )
  );
