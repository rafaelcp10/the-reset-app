-- Misturar a voz do ritual com a música que já está tocando.
--
-- É uma preferência e não um automatismo porque o app não tem como saber
-- se há música tocando: o navegador não vê o áudio de outro aplicativo.
--
-- E precisa ser escolha consciente porque tem um preço. O iOS só mistura
-- áudio na categoria "ambiente", que é **silenciada pelo interruptor
-- lateral** do aparelho. A categoria que ignora o interruptor — a que o
-- app usa hoje, e que consertou a respiração não tocar — é a mesma que
-- derruba a música. Não dá para ter as duas.
--
-- Quem liga isto está dizendo "eu ponho música antes", e quem põe música
-- não está no silencioso.
alter table usuarios
  add column if not exists misturar_com_musica boolean not null default false;
