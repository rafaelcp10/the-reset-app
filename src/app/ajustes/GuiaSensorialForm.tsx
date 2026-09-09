"use client";

import { useEffect, useState } from "react";
import {
  gravarGuia,
  lerGuia,
  vibracaoDisponivel,
  type GuiaSensorial,
} from "@/lib/ui/sensorial";

const OPCOES: { valor: GuiaSensorial; rotulo: string }[] = [
  { valor: "silencioso", rotulo: "Só os pontos" },
  { valor: "vibracao", rotulo: "Vibração" },
  { valor: "som", rotulo: "Som" },
];

/**
 * Como a respiração é guiada no Espelho. A preferência é do aparelho, por
 * isso mora no navegador e não na conta — e por isso só pode ser lida
 * depois de montar.
 */
export default function GuiaSensorialForm() {
  const [guia, setGuia] = useState<GuiaSensorial>("silencioso");
  const [temVibracao, setTemVibracao] = useState(true);

  useEffect(() => {
    // Só depois de montar: localStorage e navigator não existem no
    // servidor, e ler ali faria o HTML divergir do cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuia(lerGuia());
    setTemVibracao(vibracaoDisponivel());
  }, []);

  function escolher(valor: GuiaSensorial) {
    setGuia(valor);
    gravarGuia(valor);
    if (valor === "vibracao") {
      try {
        navigator.vibrate?.([40, 60, 40]);
      } catch {
        // Só a amostra; a preferência já ficou salva.
      }
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Guia da respiração
      </h2>

      <div className="flex gap-2">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => escolher(opcao.valor)}
            className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3 text-center text-[12px] tracking-[.09em] text-texto ${
              guia === opcao.valor ? "pilula-ativa" : ""
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <p className="text-[13px] leading-[1.6] text-auxiliar">
        {guia === "som"
          ? "Um tom grave sobe e desce no ritmo da respiração. Dá para fechar os olhos."
          : guia === "vibracao"
            ? "Uma vibração curta marca o começo de cada respiração, e cada marcação no app."
            : "Os dez pontos na tela conduzem o ritmo, em silêncio."}
      </p>

      {!temVibracao && (
        <p className="text-[12.5px] leading-[1.5] text-auxiliar-fraco">
          Este aparelho não vibra pelo navegador — no iPhone o Safari não
          permite. O som funciona normalmente.
        </p>
      )}
    </section>
  );
}
