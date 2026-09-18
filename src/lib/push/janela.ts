import type { PartesData } from "@/lib/ritual/tempo";

/**
 * Quanto tempo já passou do horário alvo, no dia da pessoa.
 *
 * O dia do app vira às 3h, não à meia-noite. Sem isso, um check-in marcado
 * para 21h30 e um cron rodando à 1h da manhã dariam "faltam 20 horas", em
 * vez de "passaram 3h30" — e a notificação da noite anterior nunca sairia.
 *
 * Devolve minutos: positivo depois do alvo, negativo antes.
 */
export function minutosDesde(partes: PartesData, alvoHora: number, alvoMinuto = 0) {
  const desdeAsTres = (hora: number, minuto: number) =>
    ((hora - 3 + 24) % 24) * 60 + minuto;

  return (
    desdeAsTres(partes.hora, partes.minuto) - desdeAsTres(alvoHora, alvoMinuto)
  );
}

/**
 * Passou do horário, e ainda dá para avisar sem ser inconveniente.
 *
 * O teto existe porque o cron pode atrasar horas: sem ele, um check-in de
 * 21h30 viraria uma notificação às 2h da manhã. Atrasado demais, o app
 * cala e tenta amanhã — o que não vale uma cobrança fora de hora.
 */
export function passouEAindaCabe(
  partes: PartesData,
  alvoHora: number,
  alvoMinuto: number,
  tetoMinutos: number,
): boolean {
  const atraso = minutosDesde(partes, alvoHora, alvoMinuto);
  return atraso >= 0 && atraso <= tetoMinutos;
}
