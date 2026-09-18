import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_FOTOS = "fotos-evolucao";

/**
 * Validade da URL assinada.
 *
 * Curta de propósito: uma URL de foto de corpo que vaza não deve continuar
 * servindo a foto meia hora depois. Quinze minutos cobrem a visita à tela,
 * e a imagem já carregada no navegador não some quando o link expira — a
 * próxima abertura da página assina de novo.
 */
const VALIDADE_URL_SEGUNDOS = 15 * 60;

/**
 * A ordem é a de quem gira o corpo, e não a alfabética: o botão da tela é
 * "girar", então cada toque precisa dar o próximo quarto de volta.
 */
export const ANGULOS = [
  "frente",
  "lado_direito",
  "costas",
  "lado_esquerdo",
] as const;

export type Angulo = (typeof ANGULOS)[number];

export const ROTULO_ANGULO: Record<Angulo, string> = {
  frente: "Frente",
  lado_direito: "Lado direito",
  costas: "Costas",
  lado_esquerdo: "Lado esquerdo",
};

export function ehAngulo(valor: string): valor is Angulo {
  return (ANGULOS as readonly string[]).includes(valor);
}

export type Foto = {
  id: string;
  data: string;
  angulo: Angulo;
  url: string | null;
};

export type ParDeAngulo = {
  antes: Foto | null;
  depois: Foto | null;
  total: number;
};

export type ConjuntoDeFotos = {
  /** Primeira e mais recente de cada ângulo. */
  porAngulo: Record<Angulo, ParDeAngulo>;
  /** O que já foi tirado hoje, para saber o que falta. */
  hoje: Record<Angulo, Foto | null>;
  total: number;
};

type Linha = { id: string; data: string; angulo: Angulo; caminho: string };

const vazio = <T,>(valor: T) =>
  Object.fromEntries(ANGULOS.map((a) => [a, valor])) as Record<Angulo, T>;

/**
 * A primeira e a mais recente de cada ângulo, mais as de hoje.
 *
 * Cada ângulo tem a própria linha do tempo: quem começou a fotografar as
 * costas três meses depois tem um "antes" de costas que é o começo *dele*,
 * não um buraco. Comparar a foto de costas de hoje com a de frente do
 * primeiro dia não diria nada.
 *
 * As do meio continuam guardadas e continuam virando "depois" enquanto são
 * a última. A galeria mostra todas.
 */
export async function buscarConjuntoDeFotos(
  supabase: SupabaseClient,
  usuarioId: string,
  hoje: string,
): Promise<ConjuntoDeFotos> {
  const { data } = await supabase
    .from("fotos_evolucao")
    .select("id, data, angulo, caminho")
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: true });

  const linhas = (data ?? []) as Linha[];
  if (linhas.length === 0) {
    return {
      porAngulo: vazio<ParDeAngulo>({ antes: null, depois: null, total: 0 }),
      hoje: vazio<Foto | null>(null),
      total: 0,
    };
  }

  const primeiras = vazio<Linha | null>(null);
  const ultimas = vazio<Linha | null>(null);
  const deHoje = vazio<Linha | null>(null);
  const contagem = vazio(0);

  for (const linha of linhas) {
    if (!ehAngulo(linha.angulo)) continue;
    if (!primeiras[linha.angulo]) primeiras[linha.angulo] = linha;
    // A lista sobe no tempo, então a última vista é a mais recente.
    ultimas[linha.angulo] = linha;
    contagem[linha.angulo] += 1;
    if (linha.data === hoje) deHoje[linha.angulo] = linha;
  }

  // Uma chamada só, com os caminhos distintos: primeira, última e a de hoje
  // costumam se repetir entre si, e assinar de novo seria ida dobrada.
  const caminhos = [
    ...new Set(
      [
        ...Object.values(primeiras),
        ...Object.values(ultimas),
        ...Object.values(deHoje),
      ]
        .filter((l): l is Linha => Boolean(l))
        .map((l) => l.caminho),
    ),
  ];

  const urlPor = await assinar(supabase, caminhos);
  const montar = (linha: Linha | null) => montarFoto(linha, urlPor);

  return {
    porAngulo: Object.fromEntries(
      ANGULOS.map((a) => [
        a,
        {
          antes: montar(primeiras[a]),
          // Com uma foto só não existe "depois": existe um começo.
          depois: contagem[a] > 1 ? montar(ultimas[a]) : null,
          total: contagem[a],
        },
      ]),
    ) as Record<Angulo, ParDeAngulo>,
    hoje: Object.fromEntries(
      ANGULOS.map((a) => [a, montar(deHoje[a])]),
    ) as Record<Angulo, Foto | null>,
    total: linhas.length,
  };
}

/**
 * Todas, da mais nova para a mais antiga, agrupadas pelo dia.
 *
 * O dia é a unidade porque é assim que a sessão de foto acontece: quatro
 * ângulos de uma vez. Uma lista corrida misturaria as costas de hoje com a
 * frente de ontem.
 *
 * O teto existe para não assinar uma lista sem fim: com o lembrete mensal,
 * quarenta dias de foto são mais de três anos.
 */
const TETO_GALERIA_DIAS = 40;

export type DiaDeFotos = { data: string; fotos: Foto[] };

export async function buscarFotosPorDia(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<DiaDeFotos[]> {
  const { data } = await supabase
    .from("fotos_evolucao")
    .select("id, data, angulo, caminho")
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: false })
    .limit(TETO_GALERIA_DIAS * ANGULOS.length);

  const linhas = (data ?? []) as Linha[];
  if (linhas.length === 0) return [];

  const dias: string[] = [];
  const porDia = new Map<string, Linha[]>();
  for (const linha of linhas) {
    if (!porDia.has(linha.data)) {
      porDia.set(linha.data, []);
      dias.push(linha.data);
    }
    porDia.get(linha.data)!.push(linha);
  }

  const recortados = dias.slice(0, TETO_GALERIA_DIAS);
  const urlPor = await assinar(
    supabase,
    recortados.flatMap((d) => porDia.get(d)!.map((l) => l.caminho)),
  );

  return recortados.map((data) => ({
    data,
    // Dentro do dia, a ordem é a do giro, não a que o banco devolveu.
    fotos: ANGULOS.map((a) =>
      montarFoto(porDia.get(data)!.find((l) => l.angulo === a) ?? null, urlPor),
    ).filter((f): f is Foto => Boolean(f)),
  }));
}

async function assinar(supabase: SupabaseClient, caminhos: string[]) {
  if (caminhos.length === 0) return new Map<string, string | null>();
  const { data } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls([...new Set(caminhos)], VALIDADE_URL_SEGUNDOS);
  return new Map<string, string | null>(
    (data ?? []).map((a) => [a.path as string, a.signedUrl ?? null]),
  );
}

function montarFoto(
  linha: Linha | null,
  urlPor: Map<string, string | null>,
): Foto | null {
  if (!linha) return null;
  return {
    id: linha.id,
    data: linha.data,
    angulo: linha.angulo,
    url: urlPor.get(linha.caminho) ?? null,
  };
}
