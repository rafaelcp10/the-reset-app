import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { calcularComposicao, type Sexo } from "./composicao";
import { montarAgua, type Agua } from "./agua";
import {
  caloriasPorTipoDeDia,
  calcularMacros,
  idadeEm,
  GORDURA_G_KG_PADRAO,
  PROTEINA_G_KG_PADRAO,
  type Biotipo,
  type CaloriasDoDia,
  type Macros,
  type Objetivo,
  type TipoDeDia,
} from "./nutricao";

/** Quando não há cronômetro do dia nem tempo declarado no perfil. */
const HORAS_DE_TREINO_PADRAO = 1;

export type Nutricao = {
  hoje: string;
  /** O que falta para a conta fechar — a tela pergunta só isso. */
  faltando: ("biotipo" | "sexo" | "nascimento" | "altura" | "peso")[];
  biotipo: Biotipo | null;
  objetivo: Objetivo;
  pesoKg: number | null;
  massaMagraKg: number | null;
  /** Horas de treino que entraram na conta, e de onde vieram. */
  horasDeTreino: number;
  treinoDeHojeReal: boolean;
  corridaKm: number;
  proteinaGKg: number;
  gorduraGKg: number;
  calorias: CaloriasDoDia | null;
  macrosPorDia: Record<TipoDeDia, Macros> | null;
  /** Qual dos três dias hoje é, pelo que de fato aconteceu. */
  tipoDeHoje: TipoDeDia;
  agua: Agua;
};

/**
 * `saude_geral` não tem tradução na conta da planilha, que só conhece
 * perder, ganhar e manter. Vira manter: é o único dos três que não empurra
 * a pessoa para lado nenhum.
 */
function traduzirObjetivo(meta: string | null): Objetivo {
  if (meta === "perder_peso" || meta === "ganhar_massa") return meta;
  return "manter";
}

export async function buscarNutricao(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Nutricao> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select(
      "fuso, sexo, nascimento, altura_cm, biotipo, meta_saude, proteina_g_kg, gordura_g_kg, corrida_km, garrafa_ml, treino_minutos",
    )
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));

  const [{ data: medidas }, { data: sessoes }, { data: linhaAgua }] =
    await Promise.all([
      supabase
        .from("medidas")
        .select("data, peso_kg, altura_cm, pescoco_cm, cintura_cm, quadril_cm")
        .eq("usuario_id", usuarioId)
        .order("data", { ascending: false })
        .limit(10),
      supabase
        .from("sessoes_treino")
        .select("inicio, fim")
        .eq("usuario_id", usuarioId)
        .eq("data", hoje)
        .not("fim", "is", null),
      supabase
        .from("agua")
        .select("ml")
        .eq("usuario_id", usuarioId)
        .eq("data", hoje)
        .maybeSingle(),
    ]);

  const sexo = (usuario?.sexo as Sexo | null) ?? null;
  const biotipo = (usuario?.biotipo as Biotipo | null) ?? null;
  const alturaPerfil = (usuario?.altura_cm as number | null) ?? null;
  const nascimento = (usuario?.nascimento as string | null) ?? null;

  const linhas = (medidas ?? []) as {
    data: string;
    peso_kg: number | null;
    altura_cm: number | null;
    pescoco_cm: number | null;
    cintura_cm: number | null;
    quadril_cm: number | null;
  }[];

  const comPeso = linhas.find((m) => m.peso_kg !== null);
  const pesoKg = comPeso?.peso_kg != null ? Number(comPeso.peso_kg) : null;

  // A massa magra sai da medida mais recente em que a fita fechou. Sem
  // ela não há proteína, porque o alvo de proteína é por quilo de magra.
  const comFita = sexo
    ? linhas.find((m) => m.cintura_cm !== null && m.pescoco_cm !== null)
    : undefined;

  const composicao =
    comFita && sexo
      ? calcularComposicao(
          {
            sexo,
            alturaCm: Number(comFita.altura_cm ?? alturaPerfil ?? 0),
            pescocoCm: Number(comFita.pescoco_cm),
            cinturaCm: Number(comFita.cintura_cm),
            quadrilCm:
              comFita.quadril_cm !== null ? Number(comFita.quadril_cm) : null,
          },
          comFita.peso_kg !== null ? Number(comFita.peso_kg) : pesoKg,
        )
      : null;

  const massaMagraKg = composicao?.massaMagra ?? null;

  const faltando: Nutricao["faltando"] = [];
  if (!biotipo) faltando.push("biotipo");
  if (!sexo) faltando.push("sexo");
  if (!nascimento) faltando.push("nascimento");
  if (!alturaPerfil) faltando.push("altura");
  if (pesoKg === null) faltando.push("peso");

  // O cronômetro manda quando existe: o treino de hoje durou o que durou.
  // Sem sessão, vale o tempo declarado no perfil; sem ele, uma hora.
  const segundosDeHoje = (sessoes ?? []).reduce((soma, s) => {
    const inicio = new Date(s.inicio as string).getTime();
    const fim = new Date(s.fim as string).getTime();
    return soma + Math.max(0, (fim - inicio) / 1000);
  }, 0);

  const treinoDeHojeReal = segundosDeHoje > 0;
  const minutosDeclarados = (usuario?.treino_minutos as number | null) ?? null;
  const horasDeTreino = treinoDeHojeReal
    ? segundosDeHoje / 3600
    : minutosDeclarados
      ? minutosDeclarados / 60
      : HORAS_DE_TREINO_PADRAO;

  const corridaKm = Number(usuario?.corrida_km ?? 0);
  const proteinaGKg = Number(usuario?.proteina_g_kg ?? PROTEINA_G_KG_PADRAO);
  const gorduraGKg = Number(usuario?.gordura_g_kg ?? GORDURA_G_KG_PADRAO);
  const objetivo = traduzirObjetivo(
    (usuario?.meta_saude as string | null) ?? null,
  );

  const podeCalcular =
    biotipo !== null &&
    sexo !== null &&
    nascimento !== null &&
    alturaPerfil !== null &&
    pesoKg !== null;

  const calorias = podeCalcular
    ? caloriasPorTipoDeDia(
        {
          sexo,
          biotipo,
          pesoKg,
          alturaCm: alturaPerfil,
          idade: idadeEm(nascimento, hoje),
        },
        objetivo,
        horasDeTreino,
        corridaKm,
      )
    : null;

  // Sem fita ainda, a massa magra não existe — a proteína então sai do
  // peso total. É pior, e é melhor que não mostrar nada: a tela diz que
  // está usando o peso e convida a medir.
  const magraParaConta = massaMagraKg ?? pesoKg;

  const macrosPorDia =
    calorias && pesoKg !== null && magraParaConta !== null
      ? ({
          descanso: calcularMacros(
            calorias.descanso,
            pesoKg,
            magraParaConta,
            proteinaGKg,
            gorduraGKg,
          ),
          treino: calcularMacros(
            calorias.treino,
            pesoKg,
            magraParaConta,
            proteinaGKg,
            gorduraGKg,
          ),
          treino_e_corrida: calcularMacros(
            calorias.treino_e_corrida,
            pesoKg,
            magraParaConta,
            proteinaGKg,
            gorduraGKg,
          ),
        } as Record<TipoDeDia, Macros>)
      : null;

  return {
    hoje,
    faltando,
    biotipo,
    objetivo,
    pesoKg,
    massaMagraKg,
    horasDeTreino,
    treinoDeHojeReal,
    corridaKm,
    proteinaGKg,
    gorduraGKg,
    calorias,
    macrosPorDia,
    // O dia se declara pelo que aconteceu, não pelo que estava marcado:
    // "treino e corrida" só aparece como o de hoje quando há corrida
    // declarada, porque o app não registra corrida.
    tipoDeHoje: treinoDeHojeReal
      ? corridaKm > 0
        ? "treino_e_corrida"
        : "treino"
      : "descanso",
    agua: montarAgua(
      pesoKg,
      (usuario?.garrafa_ml as number | null) ?? null,
      Number(linhaAgua?.ml ?? 0),
    ),
  };
}
