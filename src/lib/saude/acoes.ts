"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GRUPOS, type GrupoMuscular } from "./catalogo";
import { LIMITACOES, LOCAIS, type LocalTreino } from "./dados";
import { BUCKET_FOTOS, ehAngulo, type Angulo } from "./fotos";
import { BIOTIPOS, type Biotipo } from "./nutricao";

const CAMINHO = "/saude";

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type EstadoConfig = { erro?: string };

/**
 * As cinco perguntas. Nenhuma é obrigatória a não ser o local: o resto
 * ajusta o que o app mostra, e ninguém deve ser barrado da aba por não
 * querer declarar quanto tempo tem.
 */
export async function salvarConfigAcademia(
  _anterior: EstadoConfig,
  formData: FormData,
): Promise<EstadoConfig> {
  const local = (formData.get("local") as string) ?? "";
  if (!LOCAIS.includes(local as LocalTreino)) {
    return { erro: "Escolha onde você treina." };
  }

  const minutosBruto = Number(formData.get("minutos"));
  const minutos = Number.isFinite(minutosBruto) && minutosBruto > 0 ? minutosBruto : null;

  const limitacoes = formData
    .getAll("limitacoes")
    .map(String)
    .filter((l) => (LIMITACOES as readonly string[]).includes(l));

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("usuarios")
    .update({
      treino_local: local,
      treino_minutos: minutos,
      treino_limitacoes: limitacoes,
      academia_configurada_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect(CAMINHO);
}

export async function criarTreino(formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const { supabase, user } = await usuarioAtual();
  const { count } = await supabase
    .from("treinos")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id);

  await supabase
    .from("treinos")
    .insert({ usuario_id: user.id, nome, ordem: count ?? 0 });

  revalidatePath(CAMINHO);
}

export async function salvarNomeTreino(treinoId: string, formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .update({ nome })
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
  revalidatePath(CAMINHO);
}

export async function salvarDiasTreino(treinoId: string, dias: number[]) {
  const limpos = [...new Set(dias)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .update({ dias_semana: limpos })
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
  revalidatePath(CAMINHO);
}

export async function excluirTreino(treinoId: string) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(CAMINHO);
  redirect(CAMINHO);
}

/**
 * Adiciona o exercício. `grupo` e `degrau` chegam preenchidos quando o nome
 * veio do catálogo, e vazios quando a pessoa escreveu o dela — nesse caso o
 * app não adivinha: fica sem grupo, e o degrau é o padrão de barra.
 */
export async function adicionarExercicio(treinoId: string, formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const grupoBruto = ((formData.get("grupo") as string) ?? "").trim();
  const grupo = GRUPOS.includes(grupoBruto as GrupoMuscular)
    ? (grupoBruto as GrupoMuscular)
    : null;

  const degrauBruto = Number(formData.get("degrau"));
  const degrau =
    Number.isFinite(degrauBruto) && degrauBruto >= 0 ? degrauBruto : 2.5;

  const { supabase, user } = await usuarioAtual();
  const { count } = await supabase
    .from("exercicios")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id)
    .eq("treino_id", treinoId);

  await supabase.from("exercicios").insert({
    usuario_id: user.id,
    treino_id: treinoId,
    nome,
    grupo,
    incremento_kg: degrau,
    ordem: count ?? 0,
  });

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

export async function salvarExercicio(
  exercicioId: string,
  treinoId: string,
  campos: { series: number; repeticoes: number; incremento_kg: number },
) {
  const series = Math.min(Math.max(Math.round(campos.series), 1), 20);
  const repeticoes = Math.min(Math.max(Math.round(campos.repeticoes), 1), 100);
  const incremento =
    Number.isFinite(campos.incremento_kg) && campos.incremento_kg >= 0
      ? Math.min(campos.incremento_kg, 50)
      : 2.5;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("exercicios")
    .update({ series, repeticoes, incremento_kg: incremento })
    .eq("usuario_id", user.id)
    .eq("id", exercicioId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

export async function excluirExercicio(exercicioId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("exercicios")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", exercicioId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

/**
 * Grava o que foi levantado hoje.
 *
 * Uma linha por exercício por dia: registrar de novo no mesmo dia corrige
 * o registro, não empilha um segundo. Corrigir para menos entra em
 * silêncio — sem alerta, sem cor, sem "você regrediu" —, porque é isso que
 * vira a base do próximo degrau.
 */
export async function registrarSerie(
  exercicioId: string,
  treinoId: string,
  data: string,
  valores: { carga: number | null; repeticoes: number; series: number },
) {
  const { supabase, user } = await usuarioAtual();

  const carga =
    valores.carga !== null && Number.isFinite(valores.carga) && valores.carga >= 0
      ? Math.min(valores.carga, 1000)
      : null;
  const repeticoes = Math.min(Math.max(Math.round(valores.repeticoes), 1), 100);
  const series = Math.min(Math.max(Math.round(valores.series), 1), 20);

  await supabase.from("registros_exercicio").upsert(
    {
      usuario_id: user.id,
      exercicio_id: exercicioId,
      data,
      carga_kg: carga,
      repeticoes,
      series,
    },
    { onConflict: "exercicio_id,data" },
  );

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(`${CAMINHO}/exercicios/${exercicioId}`);
}

/** Desfaz o registro de hoje. Erro de dedo acontece. */
export async function apagarRegistro(
  exercicioId: string,
  treinoId: string,
  data: string,
) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("registros_exercicio")
    .delete()
    .eq("usuario_id", user.id)
    .eq("exercicio_id", exercicioId)
    .eq("data", data);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(`${CAMINHO}/exercicios/${exercicioId}`);
}

/**
 * Começa o treino e liga o cronômetro.
 *
 * Se já havia uma sessão aberta, ela é fechada antes: quase sempre é um
 * treino de ontem que ficou sem "finalizar", e deixar duas correndo faria
 * o cronômetro mentir para as duas.
 */
export async function iniciarSessao(treinoId: string, data: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .update({ fim: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .is("fim", null);

  await supabase
    .from("sessoes_treino")
    .insert({ usuario_id: user.id, treino_id: treinoId, data });

  revalidatePath(CAMINHO);
  redirect(`${CAMINHO}/treinos/${treinoId}/sessao`);
}

/** Encerra o treino. O tempo decorrido vira o registro da sessão. */
export async function encerrarSessao(sessaoId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .update({ fim: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .eq("id", sessaoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(CAMINHO);
}

/** Descarta a sessão aberta sem guardar tempo nenhum. */
export async function descartarSessao(sessaoId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", sessaoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(CAMINHO);
}

/**
 * Registra o peso de hoje.
 *
 * Uma linha por dia: pesar de novo corrige, não empilha. Vazio apaga o
 * registro do dia — errar o número na balança acontece, e não deve exigir
 * ir a outro lugar para desfazer.
 */
/**
 * Um campo de medida por vez, salvo ao sair do campo.
 *
 * Tudo é opcional e nada bloqueia nada: quem só quer pesar, pesa. A conta
 * de gordura aparece sozinha quando pescoço e cintura existem, e some
 * quando não existem — nunca há um campo obrigatório cobrando conclusão.
 */
const LIMITES: Record<string, [number, number]> = {
  peso_kg: [25, 400],
  pescoco_cm: [20, 80],
  cintura_cm: [40, 200],
  quadril_cm: [50, 200],
};

export type CampoMedida = keyof typeof LIMITES;

export async function salvarMedida(
  data: string,
  campo: string,
  bruto: string,
) {
  if (!(campo in LIMITES)) return;
  const { supabase, user } = await usuarioAtual();
  const limpo = bruto.replace(",", ".").trim();

  if (limpo === "") {
    await apagarCampo(supabase, user.id, data, campo);
    revalidatePath(`${CAMINHO}/evolucao`);
    return;
  }

  const valor = Number(limpo);
  const [minimo, maximo] = LIMITES[campo];
  if (!Number.isFinite(valor) || valor < minimo || valor > maximo) return;

  // A altura entra junto na criação da linha: ela vem do perfil, muda uma
  // vez na vida e ninguém deveria redigitá-la toda semana. Guardada aqui,
  // editar o perfil depois não reescreve o passado.
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("altura_cm")
    .eq("id", user.id)
    .maybeSingle();

  await supabase.from("medidas").upsert(
    {
      usuario_id: user.id,
      data,
      altura_cm: perfil?.altura_cm ?? null,
      [campo]: valor,
    },
    { onConflict: "usuario_id,data" },
  );

  revalidatePath(`${CAMINHO}/evolucao`);
}

/**
 * Apagar o último campo apaga a linha. Uma linha de medida sem nenhuma
 * medida não é registro de nada — é resto.
 */
async function apagarCampo(
  supabase: Awaited<ReturnType<typeof usuarioAtual>>["supabase"],
  usuarioId: string,
  data: string,
  campo: string,
) {
  const { data: linha } = await supabase
    .from("medidas")
    .select("peso_kg, pescoco_cm, cintura_cm, quadril_cm")
    .eq("usuario_id", usuarioId)
    .eq("data", data)
    .maybeSingle();

  if (!linha) return;

  const sobra = Object.entries(linha).some(
    ([chave, valor]) => chave !== campo && valor !== null,
  );

  if (sobra) {
    await supabase
      .from("medidas")
      .update({ [campo]: null })
      .eq("usuario_id", usuarioId)
      .eq("data", data);
    return;
  }

  await supabase
    .from("medidas")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("data", data);
}

/**
 * A fórmula tem dois ramos e eles dão números diferentes, então não há como
 * escolher um padrão. É a única razão pela qual o app pergunta isso — e a
 * resposta não aparece em nenhuma outra tela.
 */
export async function salvarSexo(valor: string) {
  if (valor !== "masculino" && valor !== "feminino") return;
  const { supabase, user } = await usuarioAtual();
  await supabase.from("usuarios").update({ sexo: valor }).eq("id", user.id);
  revalidatePath(`${CAMINHO}/evolucao`);
}

/** A altura, quando o perfil não tem — sem ela a conta não sai. */
export async function salvarAltura(bruto: string) {
  const { supabase, user } = await usuarioAtual();
  const valor = Number(bruto.replace(",", ".").trim());
  if (!Number.isFinite(valor) || valor < 100 || valor > 250) return;

  await supabase
    .from("usuarios")
    .update({ altura_cm: Math.round(valor) })
    .eq("id", user.id);

  // Alturas nulas em medidas já registradas eram o passado esperando por
  // este número; preenchê-las faz a série inteira passar a calcular.
  await supabase
    .from("medidas")
    .update({ altura_cm: Math.round(valor) })
    .eq("usuario_id", user.id)
    .is("altura_cm", null);

  revalidatePath(`${CAMINHO}/evolucao`);
}

/**
 * A foto de antes e depois.
 *
 * Chega já reduzida pelo navegador — a tela envia JPEG com o lado maior em
 * 1200px, porque foto de celular crua passa de 4MB e o limite do Server
 * Action é bem menor que isso. O teto abaixo é a rede de segurança.
 */
const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

/**
 * As duas telas que mostram foto. Apagar acontece na galeria, e revalidar
 * só a Evolução deixava a foto apagada na tela de onde ela saiu.
 */
function revalidarFotos() {
  revalidatePath(`${CAMINHO}/evolucao`);
  revalidatePath(`${CAMINHO}/evolucao/fotos`);
}

export async function salvarFoto(
  data: string,
  angulo: string,
  formData: FormData,
) {
  if (!ehAngulo(angulo)) return;

  const foto = formData.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return;
  if (foto.size > TAMANHO_MAXIMO_FOTO) return;
  if (!foto.type.startsWith("image/")) return;

  const { supabase, user } = await usuarioAtual();

  // Sempre .jpg: quem envia é o canvas da tela, que só produz JPEG. Fixar a
  // extensão evita o arquivo órfão que a gravação de voz precisa caçar,
  // porque o caminho de um dia e um ângulo nunca muda.
  const caminho = `${user.id}/${data}-${angulo}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, foto, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error("upload falhou");

  await supabase
    .from("fotos_evolucao")
    .upsert(
      { usuario_id: user.id, data, angulo, caminho },
      { onConflict: "usuario_id,data,angulo" },
    );

  revalidarFotos();
}

/** Apaga o arquivo antes da linha: sem a linha, o caminho se perde. */
export async function apagarFoto(data: string, angulo: string) {
  if (!ehAngulo(angulo)) return;
  const { supabase, user } = await usuarioAtual();

  const { data: atual } = await supabase
    .from("fotos_evolucao")
    .select("caminho")
    .eq("usuario_id", user.id)
    .eq("data", data)
    .eq("angulo", angulo as Angulo)
    .maybeSingle();

  if (!atual?.caminho) return;

  await supabase.storage.from(BUCKET_FOTOS).remove([atual.caminho as string]);

  await supabase
    .from("fotos_evolucao")
    .delete()
    .eq("usuario_id", user.id)
    .eq("data", data)
    .eq("angulo", angulo as Angulo);

  revalidarFotos();
}

/**
 * As escolhas da Nutrição.
 *
 * Cada uma salva sozinha, no campo em que foi mexida: um formulário
 * inteiro com botão de salvar seria cerimônia para trocar 2,8 por 3,0.
 */
/**
 * O objetivo é o maior multiplicador da conta: perder corta 20%, ganhar
 * soma 20% — 50% de diferença entre as duas pontas. Ele morava só no
 * perfil, longe de onde os números aparecem, e ninguém tinha como
 * perceber que estava no valor errado.
 */
export async function salvarObjetivo(valor: string) {
  if (!["perder_peso", "manter", "ganhar_massa"].includes(valor)) return;
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("usuarios")
    .update({ meta_saude: valor })
    .eq("id", user.id);
  revalidatePath(`${CAMINHO}/nutricao`);
}

export async function salvarBiotipo(valor: string) {
  if (!BIOTIPOS.includes(valor as Biotipo)) return;
  const { supabase, user } = await usuarioAtual();
  await supabase.from("usuarios").update({ biotipo: valor }).eq("id", user.id);
  revalidatePath(`${CAMINHO}/nutricao`);
}

const LIMITES_NUTRICAO: Record<string, [number, number]> = {
  proteina_g_kg: [0.5, 5],
  gordura_g_kg: [0.2, 3],
  corrida_km: [0, 100],
  garrafa_ml: [100, 5000],
  // Quanto dura um treino típico. Vale como reserva quando não houve
  // cronômetro no dia — e 15 minutos a mais ou a menos mudam a conta em
  // mais de cem calorias, então ele precisa ser visível e editável aqui.
  treino_minutos: [10, 300],
};

export async function salvarAjusteNutricao(campo: string, bruto: string) {
  if (!(campo in LIMITES_NUTRICAO)) return;
  const { supabase, user } = await usuarioAtual();
  const limpo = bruto.replace(",", ".").trim();

  if (limpo === "") {
    await supabase
      .from("usuarios")
      .update({ [campo]: null })
      .eq("id", user.id);
    revalidatePath(`${CAMINHO}/nutricao`);
    return;
  }

  const valor = Number(limpo);
  const [minimo, maximo] = LIMITES_NUTRICAO[campo];
  if (!Number.isFinite(valor) || valor < minimo || valor > maximo) return;

  await supabase
    .from("usuarios")
    .update({
      [campo]:
        campo === "garrafa_ml" || campo === "treino_minutos"
          ? Math.round(valor)
          : valor,
    })
    .eq("id", user.id);

  revalidatePath(`${CAMINHO}/nutricao`);
}

/**
 * Uma garrafa a mais, ou a menos.
 *
 * Soma em mililitros sobre o que já está lá, e não sobrescreve: dois
 * toques rápidos no botão são duas garrafas, não uma. Nunca desce de zero
 * — desfazer uma garrafa que não existe não é dívida.
 */
export async function registrarAgua(data: string, deltaMl: number) {
  if (!Number.isFinite(deltaMl) || deltaMl === 0) return;
  const { supabase, user } = await usuarioAtual();

  const { data: atual } = await supabase
    .from("agua")
    .select("ml")
    .eq("usuario_id", user.id)
    .eq("data", data)
    .maybeSingle();

  const novo = Math.max(0, Number(atual?.ml ?? 0) + Math.round(deltaMl));

  await supabase
    .from("agua")
    .upsert(
      { usuario_id: user.id, data, ml: novo, atualizado_em: new Date().toISOString() },
      { onConflict: "usuario_id,data" },
    );

  revalidatePath(`${CAMINHO}/nutricao`);
  revalidatePath("/");
}
