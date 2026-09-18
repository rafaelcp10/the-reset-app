import type { DiaDaSemana } from "@/lib/saude/semana";

/**
 * Os sete dias da semana, de domingo a sábado.
 *
 * Cheio é dia treinado, contornado é dia marcado e ainda não treinado,
 * apagado é dia sem nada. Hoje ganha o traço embaixo.
 *
 * Um dia marcado que passou em branco fica **contornado, não riscado e não
 * vermelho**: "não fiz" é registro válido, não falta. É a mesma regra do
 * check-in noturno, e aqui ela é fácil de quebrar sem perceber.
 */
export default function SemanaDeTreino({ dias }: { dias: DiaDaSemana[] }) {
  return (
    <div className="flex justify-between gap-1">
      {dias.map((dia) => (
        <div key={dia.indice} className="flex flex-1 flex-col items-center gap-2">
          <span
            className={`tipo-rotulo text-[12.5px] tracking-[.06em] ${
              dia.hoje ? "text-texto" : "text-auxiliar-fraco"
            }`}
          >
            {dia.abrev}
          </span>

          <span
            aria-hidden
            className={`h-[26px] w-[26px] rounded-full ${
              dia.feito
                ? "bg-texto"
                : dia.marcado
                  ? "border border-filete-media"
                  : "bg-superficie3"
            } ${dia.futuro && !dia.marcado ? "opacity-50" : ""}`}
          />

          <span
            aria-hidden
            className={`h-[2px] w-4 rounded-full ${
              dia.hoje ? "bg-auxiliar" : "bg-transparent"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
