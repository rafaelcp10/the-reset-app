"use client";

import { useEffect, useState } from "react";
import {
  gravarGuia,
  lerGuia,
  tocarAmostra,
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
  const [amostra, setAmostra] = useState<"parado" | "tocando" | "erro">("parado");

  async function ouvirAmostra() {
    setAmostra("tocando");
    const resultado = await tocarAmostra();
    setAmostra(resultado === "tocou" ? "parado" : "erro");
  }

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
      <h2 className="tipo-rotulo text-[16px] tracking-[.1em] text-texto">
        Guia da respiração
      </h2>

      <div className="flex gap-2">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => escolher(opcao.valor)}
            className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3 text-center text-[14.5px] tracking-[.09em] text-texto ${
              guia === opcao.valor ? "pilula-ativa" : ""
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {/* O teste tinha que existir: a falha do som é invisível. Sem isto,
          descobrir que não sai áudio custava entrar no Espelho, respirar, e
          só então perceber — e a causa mais comum é o interruptor de
          silencioso, que ninguém associa a um app. */}
      {guia === "som" && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={ouvirAmostra}
            className="pilula tipo-rotulo min-h-11 self-start rounded-[10px] px-6 text-center text-[14.5px] tracking-[.09em] text-texto"
          >
            {amostra === "tocando" ? "Tocando" : "Ouvir uma amostra"}
          </button>
          <p className="text-[15.5px] leading-[1.6] text-auxiliar">
            {amostra === "erro"
              ? "Este navegador não deixa o app fazer som."
              : "Não ouviu nada? Confira o interruptor de silencioso na lateral do iPhone e o volume — no iOS ele corta o som de site mesmo com o volume alto."}
          </p>
        </div>
      )}

      <p className="text-[15.5px] leading-[1.6] text-auxiliar">
        {guia === "som"
          ? "Um tom grave sobe e desce no ritmo da respiração. Dá para fechar os olhos."
          : guia === "vibracao"
            ? "Uma vibração curta marca o começo de cada respiração, e cada marcação no app."
            : "Os dez pontos na tela conduzem o ritmo, em silêncio."}
      </p>

      {!temVibracao && (
        <p className="text-[15px] leading-[1.5] text-auxiliar-fraco">
          Este aparelho não vibra pelo navegador — no iPhone o Safari não
          permite. O som funciona normalmente.
        </p>
      )}
    </section>
  );
}
