-- Os inegociáveis atravessam a virada da semana.
--
-- Eles são guardados por semana (`compromissos.semana_inicio`), e no
-- domingo a consulta deixava de achar os da semana anterior: os três
-- sumiam da tela. A intenção nunca foi essa — a revisão de domingo existe
-- para lembrar de planejar a semana, não para apagar o que já valia. Na
-- prática os três costumam ser os mesmos, e redigitá-los toda semana é
-- trabalho que o app estava criando.
--
-- Agora, ao entrar numa semana sem inegociáveis, os da semana anterior são
-- copiados para ela.
--
-- Esta coluna é o que impede a cópia de acontecer duas vezes. Sem ela não
-- há como distinguir "semana nova, ainda vazia" de "apaguei os três de
-- propósito" — limpar um slot apaga a linha, então os dois casos são a
-- mesma consulta vazia. Com a marca, a cópia roda uma vez por semana e o
-- que a pessoa apagar depois fica apagado.
alter table usuarios
  add column if not exists inegociaveis_copiados_para date;
