import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { calcularComposicao, type Sexo } from "./composicao";
import { montarAgua, type Agua } from "./agua";
import {
  basalPuro,
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
  /** A duração de reserva declarada, em minutos. */
  treinoMinutos: number;
  corridaKm: number;
  proteinaGKg: number;
  gorduraGKg: number;
  /** O que comer: o valor escrito à mão quando existe, senão a sugestão. */
  calorias: CaloriasDoDia | null;
  /** A sugestão da conta, sempre — é ela que o botão de redefinir devolve. */
  sugestoes: CaloriasDoDia | null;
  /** Quais tipos de dia estão com valor escrito à mão. */
  manuais: Record<TipoDeDia, boolean>;
  /** O que o corpo gasta, sem objetivo nenhum. */
  gastos: CaloriasDoDia | null;
  /** O metabolismo basal puro, sem fator de rotina. */
  basalKcal: number | null;
  /** O corte bateu no piso de segurança e parou ali. */
  pisoAplicado: boolean;
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
    // `*` de propósito, e não a lista de colunas.
    //
    // O PostgREST derruba o select inteiro quando uma coluna não existe:
    // basta uma migration ainda não rodada para `usuario` voltar nulo e a
    // tela inteira parecer vazia, como se nada tivesse sido preenchido.
    // Aconteceu em 2026-09-20 e custou uma tela de Nutrição em branco com
    // todos os dados salvos no banco.
    //
    // Com `*`, coluna que ainda não existe simplesmente não vem, e o campo
    // fica vazio em vez de derrubar o resto. É uma linha só de usuário: o
    // custo de trazer tudo é nenhum.
    .select("*")
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

  const corpo = podeCalcular
    ? {
        sexo,
        biotipo,
        pesoKg,
        alturaCm: alturaPerfil,
        idade: idadeEm(nascimento, hoje),
      }
    : null;

  const conta = corpo
    ? caloriasPorTipoDeDia(
        corpo,
        objetivo,
        horasDeTreino,
        corridaKm,
        massaMagraKg,
      )
    : null;

  // O valor escrito à mão ganha da sugestão. Nulo quer dizer "use a
  // sugestão", e é o que faz redefinir custar uma linha.
  const escritos: Record<TipoDeDia, number | null> = {
    descanso: (usuario?.calorias_descanso as number | null) ?? null,
    treino: (usuario?.calorias_treino as number | null) ?? null,
    treino_e_corrida:
      (usuario?.calorias_treino_corrida as number | null) ?? null,
  };

  const sugestoes = conta?.alvos ?? null;
  const calorias = sugestoes
    ? ({
        descanso: escritos.descanso ?? sugestoes.descanso,
        treino: escritos.treino ?? sugestoes.treino,
        treino_e_corrida:
          escritos.treino_e_corrida ?? sugestoes.treino_e_corrida,
      } as CaloriasDoDia)
    : null;

  const manuais: Record<TipoDeDia, boolean> = {
    descanso: escritos.descanso !== null,
    treino: escritos.treino !== null,
    treino_e_corrida: escritos.treino_e_corrida !== null,
  };

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
    gastos: conta?.gastos ?? null,
    basalKcal: corpo ? basalPuro(corpo, massaMagraKg) : null,
    pisoAplicado: conta?.pisoAplicado ?? false,
    biotipo,
    objetivo,
    pesoKg,
    massaMagraKg,
    horasDeTreino,
    treinoDeHojeReal,
    treinoMinutos: Math.round(
      (minutosDeclarados ?? HORAS_DE_TREINO_PADRAO * 60),
    ),
    corridaKm,
    proteinaGKg,
    gorduraGKg,
    calorias,
    sugestoes,
    manuais,
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
