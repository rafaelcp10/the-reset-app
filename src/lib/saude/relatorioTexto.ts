/** A escrita dos números do relatório, igual na tela e no PDF. */

/** "outubro de 2026", ou só "outubro". */
export function nomeDoMes(mes: string, comAno = true): string {
  const [a, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    month: "long",
    ...(comAno ? { year: "numeric" } : {}),
  }).format(new Date(Date.UTC(a, m - 1, 15)));
}

export function proximoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m, 15)).toISOString().slice(0, 7);
}

/** "15h43", ou "40 min". */
export function horas(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m} min` : `${h}h${String(m).padStart(2, "0")}`;
}

/** 126.084, e não 126084. */
export function milhar(n: number): string {
  return n.toLocaleString("pt-BR");
}
