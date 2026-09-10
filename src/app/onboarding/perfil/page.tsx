"use client";

import { useActionState, useState } from "react";
import Revelar from "@/components/movimento/Revelar";
import { METAS } from "@/lib/conta/metas";
import { salvarPerfil, type EstadoPerfil } from "@/lib/conta/perfil";

const INICIAL: EstadoPerfil = {};

const CAMPO =
  "w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro";

export default function PerfilPage() {
  const [estado, acao, enviando] = useActionState(salvarPerfil, INICIAL);
  const [meta, setMeta] = useState<string>("");

  return (
    <div className="flex grow flex-col gap-8 px-6 pb-10 pt-10">
      <Revelar imediato y={14} className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">Quem é você?</h1>
        <p className="text-[14px] leading-[1.6] text-auxiliar">
          Só o nome é obrigatório. O resto é para a aba Academia, que ainda
          está por vir — e fica guardado como dado seu, nunca como nota.
        </p>
      </Revelar>

      <Revelar imediato atraso={120}>
        <form action={acao} className="flex flex-col gap-8">
          <input type="hidden" name="meta" value={meta} />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="nome"
              className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar"
            >
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              autoComplete="given-name"
              placeholder="como quer ser chamado"
              className={CAMPO}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="nascimento"
              className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar"
            >
              Nascimento
            </label>
            <input
              id="nascimento"
              name="nascimento"
              type="date"
              className={CAMPO}
            />
          </div>

          <div className="flex gap-6">
            <div className="flex flex-1 flex-col gap-2">
              <label
                htmlFor="altura"
                className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar"
              >
                Altura (cm)
              </label>
              <input
                id="altura"
                name="altura"
                type="number"
                inputMode="numeric"
                min={80}
                max={250}
                placeholder="178"
                className={CAMPO}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label
                htmlFor="peso"
                className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar"
              >
                Peso (kg)
              </label>
              <input
                id="peso"
                name="peso"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={25}
                max={400}
                placeholder="82"
                className={CAMPO}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
              O que você quer
            </span>
            <div className="flex flex-wrap gap-2">
              {METAS.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setMeta(meta === opcao.valor ? "" : opcao.valor)}
                  className={`pilula tipo-rotulo rounded-[8px] px-4 py-3 text-[12px] tracking-[.09em] text-texto ${
                    meta === opcao.valor ? "pilula-ativa" : ""
                  }`}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          {estado.erro && (
            <p className="text-[12.5px] leading-[1.5] text-erro">{estado.erro}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
          >
            {enviando ? "Salvando" : "Continuar"}
          </button>
        </form>
      </Revelar>
    </div>
  );
}
