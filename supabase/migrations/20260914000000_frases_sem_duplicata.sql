-- As 5 frases padrão podiam ser criadas várias vezes para a mesma conta.
--
-- `garantirUsuarioEFrasesPadrao` pergunta quais frases existem e insere as
-- que faltam. Entre a pergunta e a resposta cabe outra requisição fazendo
-- a mesma coisa — e no Next isso é comum, não raro: o prefetch dos links
-- do menu, o RSC da navegação e a própria página chegam juntos. Cada um
-- via "nenhuma frase" e inseria as cinco.
--
-- O efeito é duplo: a leitura de frases traz todas as versões de uma vez,
-- então a conta vai ficando mais lenta a cada abertura; e, com duas linhas
-- de mesma versão, qual delas é "a atual" passa a ser arbitrário.
--
-- O banco resolve isso melhor que o código: com a unicidade declarada, a
-- inserção perdedora falha sozinha e é ignorada — que é exatamente o
-- comportamento desejado.

-- 1. Limpa o que já entrou duplicado, preservando primeiro as linhas que
--    têm a palavra escolhida pela pessoa (essas nunca podem sumir) e,
--    entre iguais, a mais antiga.
with ranqueadas as (
  select
    id,
    row_number() over (
      partition by usuario_id, funcao, versao
      order by (preenchimento_lacuna is null), criado_em, id
    ) as posicao
  from frases
)
delete from frases
where id in (select id from ranqueadas where posicao > 1);

-- 2. Impede que volte a acontecer.
alter table frases
  add constraint frases_usuario_funcao_versao_unica
  unique (usuario_id, funcao, versao);
