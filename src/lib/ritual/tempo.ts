const INICIO_DIA_MINUTOS = 3 * 60; // o dia vira às 3h, não à meia-noite

export type PartesData = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
};

/** Data e hora "de parede" no fuso do usuário, agora. */
export function agoraNoFuso(fuso: string): PartesData {
  const formatador = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = formatador.formatToParts(new Date());
  const obter = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);

  return {
    ano: obter("year"),
    mes: obter("month"),
    dia: obter("day"),
    hora: obter("hour") % 24, // Intl retorna "24" à meia-noite em en-US
    minuto: obter("minute"),
  };
}

/** Dia "do ritual": antes das 3h ainda conta como o dia anterior. */
export function dataRitual(partes: PartesData): string {
  const data = new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia));
  if (partes.hora < 3) data.setUTCDate(data.getUTCDate() - 1);
  return data.toISOString().slice(0, 10);
}

export function diaAnteriorISO(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() - 1);
  return data.toISOString().slice(0, 10);
}

/** Domingo da semana que contém a data — a semana começa no domingo. */
export function domingoDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() - data.getUTCDay());
  return data.toISOString().slice(0, 10);
}

export type ModoRitual = "manha" | "noite";

/**
 * Manhã vai das 3h até o horário de check-in escolhido pelo usuário; do
 * check-in até as 3h do dia seguinte é noite — é essa janela que aceita o
 * registro noturno "até as 3h do dia seguinte".
 */
export function modoRitual(
  partes: PartesData,
  horarioCheckin: string,
): ModoRitual {
  const minutosAgora = partes.hora * 60 + partes.minuto;
  const [h, m] = horarioCheckin.split(":").map(Number);
  const minutosCheckin = h * 60 + (m || 0);

  if (minutosAgora >= INICIO_DIA_MINUTOS && minutosAgora < minutosCheckin) {
    return "manha";
  }
  return "noite";
}

/** Nº de semanas desde a semana em que o usuário criou a conta (semana 1). */
export function numeroDaSemana(criadoEmISO: string, dataRitualISO: string): number {
  const inicioUsuario = domingoDaSemana(criadoEmISO.slice(0, 10));
  const semanaAtual = domingoDaSemana(dataRitualISO);
  const diffDias = Math.round(
    (Date.parse(semanaAtual) - Date.parse(inicioUsuario)) / 86_400_000,
  );
  return Math.floor(diffDias / 7) + 1;
}

export function proximaSemanaISO(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + 7);
  return data.toISOString().slice(0, 10);
}

/** Formata um timestamp ISO como "6h40" no fuso do usuário. */
export function formatarHora(isoDatetime: string, fuso: string): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoDatetime));
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "00";
  return `${hora}h${minuto}`;
}

/** Data por extenso em pt-BR, a partir de um YYYY-MM-DD (sem depender do fuso). */
export function dataPorExtenso(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12));
  const formatador = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const partes = formatador.formatToParts(data);
  const diaSemana = (partes.find((p) => p.type === "weekday")?.value ?? "")
    .replace(/-feira$/, "");
  const diaMes = partes.find((p) => p.type === "day")?.value ?? "";
  const mesNome = partes.find((p) => p.type === "month")?.value ?? "";
  const capitalizada = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${capitalizada} · ${diaMes} de ${mesNome}`;
}
