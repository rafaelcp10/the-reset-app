/**
 * As metas de saúde ficam fora do módulo de ações porque um arquivo
 * "use server" só pode exportar funções assíncronas — exportar a lista de
 * lá a transformava numa referência remota, e ela chegava quebrada no
 * componente.
 */
export const METAS = [
  { valor: "perder_peso", rotulo: "Perder peso" },
  { valor: "ganhar_massa", rotulo: "Ganhar massa" },
  { valor: "manter", rotulo: "Manter" },
  { valor: "saude_geral", rotulo: "Saúde geral" },
] as const;

export const VALORES_META: string[] = METAS.map((m) => m.valor);
