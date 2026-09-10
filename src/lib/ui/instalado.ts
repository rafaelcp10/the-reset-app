"use client";

/**
 * O app está rodando instalado na tela de início, e não numa aba do
 * navegador?
 *
 * Isso muda o que é possível. O login pelo Google sai do app para o
 * accounts.google.com e volta — só que, instalado, o app tem um
 * armazenamento próprio, separado do navegador. A ida acontece num lugar
 * e a volta em outro, então o segredo que o Supabase guarda antes de sair
 * (o code verifier do PKCE) não existe mais quando o código volta. O
 * Google confirma, o app recebe o retorno e não consegue trocá-lo por
 * sessão nenhuma.
 *
 * É a mesma razão que derrubou o link mágico por e-mail, e por isso o
 * caminho de dentro do app instalado é e-mail e senha.
 */
export function appInstalado(): boolean {
  if (typeof window === "undefined") return false;
  const iOS = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  return (
    iOS === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true
  );
}
