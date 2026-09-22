"use client";

import { useActionState, useState } from "react";
import Revelar from "@/components/movimento/Revelar";
import { salvarConfigAcademia, type EstadoConfig } from "@/lib/saude/acoes";
import {
  LIMITACOES,
  LOCAIS,
  MINUTOS,
  ROTULO_LIMITACAO,
  ROTULO_LOCAL,
  type Limitacao,
  type LocalTreino,
} from "@/lib/saude/dados";
import {
  BIOTIPOS,
  DESCRICAO_BIOTIPO,
  DESCRICAO_OBJETIVO,
  OBJETIVOS,
  ROTULO_BIOTIPO,
  ROTULO_OBJETIVO,
  type Biotipo,
  type Objetivo,
} from "@/lib/saude/nutricao";

const INICIAL: EstadoConfig = {};

type Numeros = {
  garrafaMl: string;
  corridaKm: string;
  proteinaGKg: string;
  gorduraGKg: string;
};

const CAMPOS: {
  id: keyof Numeros;
  nome: string;
  rotulo: string;
  unidade: string;
  passo: string;
  nota: string;
}[] = [
  {
    id: "garrafaMl",
    nome: "garrafa_ml",
    rotulo: "Sua garrafa",
    unidade: "ml",
    passo: "50",
    nota: "É ela que vira o número de garrafas de água do dia.",
  },
  {
    id: "corridaKm",
    nome: "corrida_km",
    rotulo: "Corrida",
    unidade: "km",
    passo: "0.1",
    nota: "Quanto você costuma correr. Zero tira a corrida da conta.",
  },
  {
    id: "proteinaGKg",
    nome: "proteina_g_kg",
    rotulo: "Proteína",
    unidade: "g/kg",
    passo: "0.1",
    nota: "Por quilo de massa magra.",
  },
  {
    id: "gorduraGKg",
    nome: "gordura_g_kg",
    rotulo: "Gordura",
    unidade: "g/kg",
    passo: "0.05",
    nota: "Por quilo de peso total.",
  },
];

export default function ConfigForm({
  objetivoInicial,
  biotipoInicial,
  localInicial,
  minutosInicial,
  limitacoesIniciais,
  numerosIniciais,
}: {
  objetivoInicial: Objetivo;
  biotipoInicial: Biotipo | null;
  localInicial: LocalTreino | null;
  minutosInicial: number | null;
  limitacoesIniciais: string[];
  numerosIniciais: Numeros;
}) {
  const [estado, acao, enviando] = useActionState(salvarConfigAcademia, INICIAL);
  const [local, setLocal] = useState<LocalTreino | null>(localInicial);
  const [minutos, setMinutos] = useState<number | null>(minutosInicial);
  const [limitacoes, setLimitacoes] = useState<string[]>(limitacoesIniciais);
  const [objetivo, setObjetivo] = useState<Objetivo>(objetivoInicial);
  const [biotipo, setBiotipo] = useState<Biotipo | null>(biotipoInicial);
  const [numeros, setNumeros] = useState<Numeros>(numerosIniciais);

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
        <p className="text-[16px] leading-[1.6] text-auxiliar">
          Poucas perguntas, uma vez. O app não vai montar treino nenhum —
          quem escreve os seus é você. Isto aqui decide o que ele te mostra,
          e o objetivo decide a conta de calorias da Nutrição.
        </p>
      </Revelar>

      <Revelar imediato atraso={120}>
        <form action={acao} className="flex flex-col gap-10">
          <input type="hidden" name="objetivo" value={objetivo} />
          <input type="hidden" name="biotipo" value={biotipo ?? ""} />
          <input type="hidden" name="local" value={local ?? ""} />
          <input type="hidden" name="minutos" value={minutos ?? ""} />
          {limitacoes.map((l) => (
            <input key={l} type="hidden" name="limitacoes" value={l} />
          ))}

          {/* Primeiro de todos: é a única pergunta daqui que muda um número
              de verdade, e em até 35% entre as pontas. */}
          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Objetivo
            </h2>
            <div className="flex flex-col gap-1.5">
              {OBJETIVOS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setObjetivo(opcao)}
                  aria-pressed={objetivo === opcao}
                  className={`flex min-h-11 flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5 text-left transition-colors duration-200 ${
                    objetivo === opcao ? "bg-superficie3" : "bg-superficie3/40"
                  }`}
                >
                  <span
                    className={`text-[16px] ${
                      objetivo === opcao ? "text-texto" : "text-auxiliar"
                    }`}
                  >
                    {ROTULO_OBJETIVO[opcao]}
                  </span>
                  <span className="text-[14.5px] leading-[1.4] text-auxiliar-fraco">
                    {DESCRICAO_OBJETIVO[opcao]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Logo depois do objetivo, porque é a segunda coisa que mais
              mexe na conta de calorias: multiplica o basal em até 40%. */}
          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Biotipo
            </h2>
            <div className="flex flex-col gap-1.5">
              {BIOTIPOS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setBiotipo(opcao)}
                  aria-pressed={biotipo === opcao}
                  className={`flex min-h-11 flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5 text-left transition-colors duration-200 ${
                    biotipo === opcao ? "bg-superficie3" : "bg-superficie3/40"
                  }`}
                >
                  <span
                    className={`text-[16px] ${
                      biotipo === opcao ? "text-texto" : "text-auxiliar"
                    }`}
                  >
                    {ROTULO_BIOTIPO[opcao]}
                  </span>
                  <span className="text-[14.5px] leading-[1.4] text-auxiliar-fraco">
                    {DESCRICAO_BIOTIPO[opcao]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Onde
            </h2>
            <div className="flex gap-2">
              {LOCAIS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setLocal(opcao)}
                  className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] px-2 text-center text-[14.5px] tracking-[.06em] text-texto ${
                    local === opcao ? "pilula-ativa" : ""
                  }`}
                >
                  {ROTULO_LOCAL[opcao]}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Quanto tempo por sessão
            </h2>
            <div className="flex gap-2">
              {MINUTOS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setMinutos(minutos === opcao ? null : opcao)}
                  className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] text-center text-[14.5px] tracking-[.06em] text-texto ${
                    minutos === opcao ? "pilula-ativa" : ""
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
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
                  className={`pilula tipo-rotulo min-h-11 rounded-[8px] px-4 text-center text-[14.5px] tracking-[.06em] text-texto ${
                    limitacoes.includes(opcao) ? "pilula-ativa" : ""
                  }`}
                >
                  {ROTULO_LIMITACAO[opcao]}
                </button>
              ))}
            </div>
            <p className="text-[15.5px] leading-[1.6] text-auxiliar-fraco">
              Nada aqui bloqueia exercício. Serve para você lembrar na hora de
              escolher a carga.
            </p>
          </section>

          {/* Os números da Nutrição moravam na própria aba. Saíram para cá:
              quem procura configuração procura na engrenagem, e dois
              lugares para a mesma coisa ensinam a não confiar em nenhum. */}
          <section className="flex flex-col gap-4">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Números da conta
            </h2>
            {CAMPOS.map((campo) => (
              <label key={campo.id} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[16px] text-texto">{campo.rotulo}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <input
                      type="number"
                      name={campo.nome}
                      inputMode="decimal"
                      step={campo.passo}
                      value={numeros[campo.id]}
                      onChange={(e) =>
                        setNumeros((n) => ({ ...n, [campo.id]: e.target.value }))
                      }
                      placeholder="—"
                      className="w-[86px] border-b border-filete-media bg-transparent py-1.5 text-right text-[19px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
                    />
                    <span className="w-10 text-[15px] text-auxiliar">
                      {campo.unidade}
                    </span>
                  </span>
                </span>
                <span className="text-[14.5px] leading-[1.4] text-auxiliar-fraco">
                  {campo.nota}
                </span>
              </label>
            ))}
          </section>

          {estado.erro && (
            <p className="text-[15px] leading-[1.5] text-erro">{estado.erro}</p>
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
