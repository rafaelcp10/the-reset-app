import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarNutricao } from "@/lib/saude/nutricaoDados";
import {
  ROTULO_DIA,
  comMilhar,
  type Macros,
  type TipoDeDia,
} from "@/lib/saude/nutricao";
import { formatarDuracao } from "@/lib/saude/sessao";
import CabecalhoSaude from "../CabecalhoSaude";
import ContadorAgua from "./ContadorAgua";
import AjustesNutricao from "./AjustesNutricao";
import Painel, { LinhaDoPainel, ParValor } from "@/components/saude/Painel";
import Revelar from "@/components/movimento/Revelar";

const ORDEM: TipoDeDia[] = ["descanso", "treino", "treino_e_corrida"];

const FALTANDO: Record<string, { texto: string; href?: string }> = {
  biotipo: { texto: "escolher o biotipo, aqui embaixo" },
  sexo: {
    texto: "dizer qual conta de gordura usar, na Evolução",
    href: "/saude/evolucao",
  },
  nascimento: { texto: "sua data de nascimento, nos Ajustes", href: "/ajustes" },
  altura: { texto: "sua altura, nos Ajustes", href: "/ajustes" },
  peso: { texto: "registrar seu peso, na Evolução", href: "/saude/evolucao" },
};

function g(valor: number): string {
  return Math.round(valor).toLocaleString("pt-BR");
}

export default async function NutricaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const n = await buscarNutricao(supabase, user.id);
  const macrosDeHoje = n.macrosPorDia?.[n.tipoDeHoje] ?? null;

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4} className="mb-2">
        <CabecalhoSaude aba="nutricao" />
      </Revelar>

      {n.calorias === null || macrosDeHoje === null ? (
        <Revelar imediato atraso={80}>
          <Painel icone={UtensilsCrossed} rotulo="Falta pouco">
            <p className="text-[16px] leading-[1.6] text-auxiliar">
              A conta precisa de mais {n.faltando.length}{" "}
              {n.faltando.length === 1 ? "coisa" : "coisas"}:
            </p>
            <ul className="flex flex-col gap-1.5">
              {n.faltando.map((o) => (
                <li key={o} className="text-[16px] leading-[1.5] text-texto">
                  {FALTANDO[o].href ? (
                    <Link
                      href={FALTANDO[o].href}
                      className="underline underline-offset-4"
                    >
                      {FALTANDO[o].texto}
                    </Link>
                  ) : (
                    FALTANDO[o].texto
                  )}
                </li>
              ))}
            </ul>
          </Painel>
        </Revelar>
      ) : (
        <>
          {/* O dia de hoje, já decidido pelo que aconteceu. Ele vem antes
              dos três porque é o único que a pessoa vai usar agora. */}
          <Revelar imediato atraso={80}>
            <Painel
              icone={Flame}
              rotulo={`Hoje · ${ROTULO_DIA[n.tipoDeHoje].toLowerCase()}`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[38px] leading-none tabular-nums text-texto">
                  {comMilhar(n.calorias[n.tipoDeHoje])}
                </span>
                <span className="text-[18px] text-auxiliar">kcal</span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <ParValor
                  valor={`${g(macrosDeHoje.proteinaG)} g`}
                  rotulo="proteína"
                />
                <ParValor
                  valor={`${g(macrosDeHoje.gorduraG)} g`}
                  rotulo="gordura"
                />
                <ParValor
                  valor={`${g(macrosDeHoje.carboidratoG)} g`}
                  rotulo="carboidrato"
                />
              </div>

              <p className="text-[14px] leading-[1.5] text-auxiliar-fraco">
                {n.treinoDeHojeReal
                  ? `Com ${formatarDuracao(Math.round(n.horasDeTreino * 3600))} de treino, do cronômetro de hoje.`
                  : "Nenhum treino registrado hoje."}
                {n.massaMagraKg === null &&
                  " A proteína está saindo do peso total: passe a fita na Evolução e ela passa a sair da massa magra."}
              </p>
            </Painel>
          </Revelar>

          <Revelar imediato atraso={140}>
            <Painel icone={UtensilsCrossed} rotulo="Os três dias">
              <div className="flex flex-col gap-2">
                {ORDEM.map((tipo) => (
                  <LinhaDoPainel
                    key={tipo}
                    titulo={ROTULO_DIA[tipo]}
                    detalhe={resumoDeMacros(n.macrosPorDia![tipo])}
                    valor={comMilhar(n.calorias![tipo])}
                    unidade="kcal"
                  />
                ))}
              </div>

              {/* Sem uma linha de fisiologia: a regra de "nenhuma
                  justificativa científica na interface" vale aqui inteira.
                  O que a tela diz é de onde os números vieram. */}
              <p className="text-[14px] leading-[1.5] text-auxiliar-fraco">
                {n.corridaKm > 0
                  ? `Corrida contada em ${String(n.corridaKm).replace(".", ",")} km.`
                  : "Sem corrida na conta — diga quantos quilômetros ali embaixo."}
              </p>
            </Painel>
          </Revelar>
        </>
      )}

      <Revelar atraso={40}>
        <ContadorAgua data={n.hoje} agua={n.agua} pesoKg={n.pesoKg} />
      </Revelar>

      <Revelar atraso={80}>
        <AjustesNutricao
          biotipo={n.biotipo}
          garrafaMl={n.agua.garrafaMl}
          corridaKm={n.corridaKm}
          proteinaGKg={n.proteinaGKg}
          gorduraGKg={n.gorduraGKg}
        />
      </Revelar>
    </div>
  );
}

/** "185 P · 76 G · 229 C" — cabe na linha e a ordem é sempre a mesma. */
function resumoDeMacros(m: Macros): string {
  return `${g(m.proteinaG)} P · ${g(m.gorduraG)} G · ${g(m.carboidratoG)} C`;
}
