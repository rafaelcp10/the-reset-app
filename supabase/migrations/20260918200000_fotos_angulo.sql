-- Quatro ângulos por sessão de foto, em vez de uma foto solta.
--
-- Uma foto de frente esconde o que mudou de lado e nas costas — são os
-- ângulos que mais mudam e os que a pessoa menos vê no espelho. Com os
-- quatro, o par "antes e depois" passa a girar junto: escolhido o ângulo,
-- as duas fotos mostram o mesmo ângulo.
--
-- Os arquivos antigos ficam onde estão: o caminho é guardado por linha, e
-- as fotos já tiradas eram todas de frente.
alter table fotos_evolucao
  add column if not exists angulo text not null default 'frente';

alter table fotos_evolucao drop constraint if exists fotos_evolucao_angulo_check;
alter table fotos_evolucao
  add constraint fotos_evolucao_angulo_check check (
    angulo in ('frente', 'lado_direito', 'costas', 'lado_esquerdo')
  );

-- O dia deixa de ser único por si: agora o que não se repete é o par
-- dia + ângulo. Tirar de novo o mesmo ângulo no mesmo dia corrige, e não
-- empilha — mesma decisão das medidas.
alter table fotos_evolucao
  drop constraint if exists fotos_evolucao_usuario_id_data_key;
alter table fotos_evolucao
  drop constraint if exists fotos_evolucao_usuario_data_angulo_key;
alter table fotos_evolucao
  add constraint fotos_evolucao_usuario_data_angulo_key
  unique (usuario_id, data, angulo);

-- O default serviu para as linhas que já existiam. Daqui para a frente o
-- ângulo é sempre dito por quem grava.
alter table fotos_evolucao alter column angulo drop default;
