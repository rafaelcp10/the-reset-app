"use client";

import { useActionState, useState } from "react";
import Revelar from "@/components/movimento/Revelar";
import { salvarConfigAcademia, type EstadoConfig } from "@/lib/academia/acoes";
import {
  LIMITACOES,
  LOCAIS,
  MINUTOS,
  ROTULO_LIMITACAO,
  ROTULO_LOCAL,
  type Limitacao,
  type LocalTreino,
} from "@/lib/academia/dados";

const INICIAL: EstadoConfig = {};

export default function ConfigForm({
  localInicial,
  minutosInicial,
  limitacoesIniciais,
}: {
  localInicial: LocalTreino | null;
  minutosInicial: number | null;
  limitacoesIniciais: string[];
}) {
  const [estado, acao, enviando] = useActionState(salvarConfigAcademia, INICIAL);
  const [local, setLocal] = useState<LocalTreino | null>(localInicial);
  const [minutos, setMinutos] = useState<number | null>(minutosInicial);
  const [limitacoes, setLimitacoes] = useState<string[]>(limitacoesIniciais);

  function alternarLimitacao(valor: Limitacao) {
    setLimitacoes((atuais) =>
      atuais.includes(valor)
        ? atuais.filter((l) => l !== valor)
        : [...atuais, valor],
    );
  }

  return (
    <div className="flex grow flex-col gap-10 px-6 pb-10 pt-10">
      <Revelar imediato y={14} className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Como você treina?
        </h1>
        <p className="text-[14px] leading-[1.6] text-auxiliar">
          Cinco perguntas, uma vez. O app não vai montar treino nenhum — quem
          escreve os seus é você. Isto aqui só decide o que ele te mostra.
        </p>
      </Revelar>

      <Revelar imediato atraso={120}>
        <form action={acao} className="flex flex-col gap-10">
          <input type="hidden" name="local" value={local ?? ""} />
          <input type="hidden" name="minutos" value={minutos ?? ""} />
          {limitacoes.map((l) => (
            <input key={l} type="hidden" name="limitacoes" value={l} />
          ))}

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
              Onde
            </h2>
            <div className="flex gap-2">
              {LOCAIS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setLocal(opcao)}
                  className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] px-2 text-center text-[12px] tracking-[.06em] text-texto ${
                    local === opcao ? "pilula-ativa" : ""
                  }`}
                >
                  {ROTULO_LOCAL[opcao]}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
              Quanto tempo por sessão
            </h2>
            <div className="flex gap-2">
              {MINUTOS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setMinutos(minutos === opcao ? null : opcao)}
                  className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] text-center text-[12px] tracking-[.06em] text-texto ${
                    minutos === opcao ? "pilula-ativa" : ""
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
              Onde costuma doer
            </h2>
            {/* Não é diagnóstico, e o app não vai proibir nada: fica
                guardado para você lembrar na hora de escolher a carga. */}
            <div className="flex flex-wrap gap-2">
              {LIMITACOES.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => alternarLimitacao(opcao)}
                  className={`pilula tipo-rotulo min-h-11 rounded-[8px] px-4 text-center text-[12px] tracking-[.06em] text-texto ${
                    limitacoes.includes(opcao) ? "pilula-ativa" : ""
                  }`}
                >
                  {ROTULO_LIMITACAO[opcao]}
                </button>
              ))}
            </div>
            <p className="text-[13px] leading-[1.6] text-auxiliar-fraco">
              Nada aqui bloqueia exercício. Serve para você lembrar na hora de
              escolher a carga.
            </p>
          </section>

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
