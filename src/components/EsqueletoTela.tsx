/**
 * O que aparece enquanto a tela seguinte não chegou.
 *
 * Não é enfeite: sem um `loading`, o Next mantém a tela antiga até o
 * servidor terminar de responder, e o toque fica sem retorno nenhum — a
 * pessoa toca de novo achando que não pegou. E é ele que permite ao Next
 * pré-carregar rotas dinâmicas, porque é a parte que dá para preparar
 * antes de saber os dados.
 *
 * Sem âmbar de propósito: isto é ausência de conteúdo, não um destaque.
 */
export default function EsqueletoTela({
  linhas = 3,
}: {
  /** Quantos blocos de conteúdo insinuar abaixo do título. */
  linhas?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex grow flex-col gap-7 px-6 pb-[26px] pt-8"
    >
      <div className="flex flex-col gap-3">
        <div className="esqueleto h-3 w-24" />
        <div className="esqueleto h-6 w-40" />
      </div>

      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <div className="esqueleto h-3 w-20" />
          <div className="esqueleto h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
