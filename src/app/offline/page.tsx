import Logo from "@/components/Logo";

/**
 * Tela servida pelo service worker quando não há rede. É estática de
 * propósito: nada aqui depende do servidor, senão não apareceria.
 */
export default function OfflinePage() {
  return (
    <div className="flex grow flex-col justify-between px-6 pb-10 pt-16">
      <Logo variante="topo" />

      <div className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Sem conexão agora.
        </h1>
        <p className="text-[15px] leading-[1.6] text-auxiliar">
          O ritual continua o mesmo: as cinco frases, em voz alta, e uma
          linha sobre hoje. Quando a rede voltar, é só abrir de novo — nada
          se perde.
        </p>
      </div>

      <span className="tipo-rotulo text-[10px] tracking-[.18em] text-auxiliar-minimo">
        The Reset
      </span>
    </div>
  );
}
