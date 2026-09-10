export const ROTAS_ONBOARDING = [
  "/onboarding/abertura",
  "/onboarding/identidade",
  "/onboarding/seguranca",
  "/onboarding/como-falo",
  "/onboarding/palavra",
  "/onboarding/ritmo",
  "/onboarding/horario",
  "/onboarding/conta",
  "/onboarding/perfil",
  "/onboarding/instalar",
] as const;

/**
 * "PASSO N DE 5" — o handoff tinha 4; conta e perfil viraram o 5º — a etapa "frases 2 a 5" conta como um só passo
 * macro (3), com contador próprio "X de 5" dentro dela. A tela de instalar
 * é um 5º passo que o handoff não cobre (ver CLAUDE.md/decisão do usuário:
 * obrigatório pro iPhone receber notificação), por isso fica sem número.
 */
const PASSO_MACRO: Partial<Record<(typeof ROTAS_ONBOARDING)[number], number>> = {
  "/onboarding/identidade": 2,
  "/onboarding/seguranca": 3,
  "/onboarding/como-falo": 3,
  "/onboarding/palavra": 3,
  "/onboarding/ritmo": 3,
  "/onboarding/horario": 4,
  "/onboarding/conta": 5,
  "/onboarding/perfil": 5,
};

export function passoMacroDe(pathname: string): number | null {
  return PASSO_MACRO[pathname as (typeof ROTAS_ONBOARDING)[number]] ?? null;
}
