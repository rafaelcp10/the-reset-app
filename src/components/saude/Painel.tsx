import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * O bloco com cabeçalho, que é a unidade da Saúde.
 *
 * Cabeçalho é ícone + rótulo em caixa alta, e é o que dá para varrer a tela
 * com o polegar sem ler: o ícone chega antes da palavra. Quando o painel
 * leva a algum lugar, a seta fica no cabeçalho e o painel inteiro vira
 * alvo — meia tela de alvo é mais honesto que uma seta de 22px.
 */
export default function Painel({
  icone: Icone,
  rotulo,
  href,
  acao,
  children,
}: {
  icone: LucideIcon;
  rotulo: string;
  /** Quando existe, o painel inteiro é um link. */
  href?: string;
  /** Um controle à direita do rótulo, quando o painel não é um link. */
  acao?: ReactNode;
  children: ReactNode;
}) {
  const conteudo = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Icone
            className="h-[18px] w-[18px] shrink-0 text-auxiliar"
            strokeWidth={1.5}
          />
          <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
            {rotulo}
          </span>
        </span>
        {href ? (
          <ChevronRight
            className="h-[20px] w-[20px] shrink-0 text-auxiliar-fraco"
            strokeWidth={1.5}
          />
        ) : (
          acao
        )}
      </div>
      {children}
    </>
  );

  const classe = "bloco flex flex-col gap-3 px-4 py-4";

  return href ? (
    <Link href={href} className={`${classe} bloco-toque`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/**
 * Uma linha dentro de um painel — um treino, um exercício, um item.
 *
 * Superfície um tom acima da do painel, como os painéis são um tom acima do
 * fundo: a mesma gramática de elevação, um nível abaixo. Sem borda, pelo
 * mesmo motivo de sempre — elevação já resolve.
 */
export function LinhaDoPainel({
  titulo,
  detalhe,
  valor,
  unidade,
  href,
}: {
  titulo: string;
  detalhe?: string;
  valor?: string;
  unidade?: string;
  href?: string;
}) {
  const conteudo = (
    <>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[16px] leading-[1.3] text-texto">
          {titulo}
        </span>
        {detalhe && (
          <span className="truncate text-[14.5px] text-auxiliar-fraco">
            {detalhe}
          </span>
        )}
      </span>

      {valor !== undefined ? (
        <span className="flex shrink-0 items-baseline gap-1">
          <span className="text-[19px] tabular-nums text-texto">{valor}</span>
          {unidade && (
            <span className="text-[14px] text-auxiliar">{unidade}</span>
          )}
        </span>
      ) : href ? (
        <ChevronRight
          className="h-[20px] w-[20px] shrink-0 text-auxiliar-fraco"
          strokeWidth={1.5}
        />
      ) : null}
    </>
  );

  const classe =
    "flex min-h-[60px] items-center justify-between gap-3 rounded-[10px] bg-superficie3 px-3.5 py-2.5";

  return href ? (
    <Link href={href} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/**
 * "3 de 4", em barra.
 *
 * O denominador nunca é meta do app — é sempre algo que a pessoa declarou.
 * Sem cor que muda conforme o quanto falta, e sem barra cheia comemorando:
 * a barra diz onde está, não se está bom.
 */
export function Barra({ feito, total }: { feito: number; total: number }) {
  if (total <= 0) return null;
  const parte = Math.min(1, feito / total);

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-superficie3"
      role="presentation"
    >
      <div
        className="h-full rounded-full bg-texto transition-[width] duration-500"
        style={{ width: `${Math.round(parte * 100)}%` }}
      />
    </div>
  );
}

/**
 * "3,08 KM · DISTÂNCIA" — número forte, rótulo apagado, lado a lado.
 *
 * Cabe mais informação numa linha do que em frase, e a vista pega o número
 * antes de ler a palavra.
 */
export function ParValor({
  valor,
  rotulo,
}: {
  valor: string;
  rotulo: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[16px] tabular-nums text-texto">{valor}</span>
      <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
        {rotulo}
      </span>
    </span>
  );
}
