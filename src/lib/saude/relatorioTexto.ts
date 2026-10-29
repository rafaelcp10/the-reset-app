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

/** "19,5%", "86,6 kg", "92 cm". */
export function valorDoCorpo(valor: number, unidade: "%" | "kg" | "cm"): string {
  const r = Math.round(valor * 10) / 10;
  const n = r % 1 === 0 && unidade !== "%" ? String(r) : r.toFixed(1).replace(".", ",");
  return unidade === "%" ? `${n}%` : `${n} ${unidade}`;
}

/**
 * "−1,8 kg", "+0,5 cm", "−1,5 p.p.", ou "igual".
 *
 * A diferença de percentual é em pontos percentuais: de 21% para 19,5% não
 * são "−1,5%", são −1,5 p.p. Sem cor e sem seta, com o menos de verdade.
 */
export function diferencaDoCorpo(dif: number, unidade: "%" | "kg" | "cm"): string {
  // Arredonda antes de decidir: subtração de decimais dá 1,7999999, e
  // "2,0000001 cm" sairia "2,0 cm" em vez de "2 cm".
  const r = Math.round(Math.abs(dif) * 10) / 10;
  if (r === 0) return "igual";
  const n = r % 1 === 0 ? String(r) : r.toFixed(1).replace(".", ",");
  return `${dif > 0 ? "+" : "−"}${n} ${unidade === "%" ? "p.p." : unidade}`;
}

/** "18/09". */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
