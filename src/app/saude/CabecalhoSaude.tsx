import Link from "next/link";
import { Settings } from "lucide-react";

/**
 * O topo da Saúde: título, ajustes e as abas.
 *
 * As abas ficam aqui e não num layout do Next de propósito — a sessão de
 * treino e o histórico de um exercício são telas de foco, onde trocar de
 * aba no meio seria convite para largar o que está em curso. Só as duas
 * telas de nível superior mostram a barra.
 */
export default function CabecalhoSaude({ aba }: { aba: "treino" | "evolucao" }) {
  const abas = [
    { id: "treino" as const, rotulo: "Treino", href: "/saude" },
    { id: "evolucao" as const, rotulo: "Evolução", href: "/saude/evolucao" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 px-1">
        <h1 className="text-[26px] leading-tight text-texto">Saúde</h1>
        <Link
          href="/saude/configurar"
          aria-label="Ajustar como você treina"
          className="-m-3 inline-flex shrink-0 p-3 text-auxiliar"
        >
          <Settings className="h-[22px] w-[22px]" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Pílulas, como no Zepp. A aba da vez se distingue por superfície e
          brilho do texto, não por uma segunda cor: o âmbar desta tela
          pertence ao botão de iniciar. */}
      <div className="bloco flex gap-1 rounded-full p-1">
        {abas.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={aba === item.id ? "page" : undefined}
            className={`tipo-rotulo flex min-h-11 flex-1 items-center justify-center rounded-full text-center text-[13px] tracking-[.09em] transition-colors duration-200 ${
              aba === item.id
                ? "bg-superficie3 text-texto"
                : "text-auxiliar-fraco"
            }`}
          >
            {item.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}
