import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Dumbbell, Sparkles, Sun, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoHome } from "@/lib/home/dados";
import { buscarResumoDoDia } from "@/lib/home/resumo";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import Logo from "@/components/Logo";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";
import FaixaSemanas from "@/components/home/FaixaSemanas";
import QuadroDaSemana from "@/components/home/QuadroDaSemana";
import ContadorAgua from "@/app/saude/nutricao/ContadorAgua";
import MarcaFeito from "@/components/MarcaFeito";
import Painel, { Barra, ParValor } from "@/components/saude/Painel";
import Grafico from "@/components/saude/Grafico";
import Revelar from "@/components/movimento/Revelar";

const CAMINHO = "/";

/** 60, não 60,00. */
function kg(valor: number): string {
  const n = Number(valor);
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);

  // As duas em paralelo, e não o resumo depois dos desvios: quem é mandado
  // para o onboarding ou para o recomeço é raro, e fazer todo mundo esperar
  // uma segunda ida ao banco para poupar trabalho nesses dois casos sai
  // caro na tela mais visitada do app.
  const [estado, resumo] = await Promise.all([
    buscarEstadoHome(supabase, user.id),
    buscarResumoDoDia(supabase, user.id),
  ]);
  const { identidade } = estado;

  // Quem nunca escolheu a palavra da frase 1 nunca foi conduzido: manda
  // para o onboarding em vez de largar na tela com as frases padrão. A
  // frase de identidade já veio na busca acima, então a pergunta custa
  // zero — antes era uma ida ao banco só para reler o que já viria.
  if (!identidade?.preenchimento_lacuna?.trim()) {
    redirect("/onboarding/abertura");
  }

  // "Vários dias sem abrir" — o exemplo do handoff usa 6 dias como cenário
  // de validação, por isso o limiar aqui. Não conta pra quem nunca abriu.
  if (estado.diasSemAbrir !== null && estado.diasSemAbrir >= 6) {
    redirect("/recomeco");
  }

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-[30px] pt-[52px]">
      {/* A frase encolheu para caber num painel de controle, mas continua
          sendo a primeira coisa e continua na fonte das frases. Ela é o
          motivo de o app existir; os painéis abaixo são o que ele faz. */}
      <Revelar imediato y={14} desfoque={4} className="mb-1 px-1">
        <FraseIdentidadeRitual
          textoBase={identidade?.texto ?? FRASES_PADRAO.identidade.texto}
          preenchimento={identidade?.preenchimento_lacuna ?? ""}
          caminhoAtual={CAMINHO}
          tamanho="cabecalho"
          editavel={false}
        />
      </Revelar>

      {/* O ritual é a razão da tela, então é o único painel com botão e a
          única aplicação de âmbar aqui. */}
      <Revelar imediato atraso={80}>
        <Painel icone={Sparkles} rotulo="Ritual">
          {estado.espelhoFeitoHoje ? (
            <>
              <p className="text-[18px] leading-[1.35] text-texto">
                Feito hoje
                {estado.horaRegistroHoje ? `, às ${estado.horaRegistroHoje}` : ""}
                .
              </p>
              <Link
                href="/ritual/espelho"
                className="text-[15px] text-auxiliar underline underline-offset-4"
              >
                entrar de novo
              </Link>
            </>
          ) : (
            <>
              <p className="text-[18px] leading-[1.35] text-texto">
                Ainda não feito hoje.
              </p>
              <Link
                href="/ritual/espelho"
                className="botao-acento tipo-rotulo block w-full rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
              >
                Entrar no espelho
              </Link>
            </>
          )}
        </Painel>
      </Revelar>

      {/* A água vem logo depois do ritual, e não lá no fim, porque é a
          outra coisa da Home que se **faz** em vez de se ler — e a que se
          faz mais vezes por dia. Estava a três toques de distância, dentro
          da Nutrição; aqui é um.

          Sem âmbar: o acento desta tela é o botão do espelho. */}
      <Revelar imediato atraso={110}>
        <ContadorAgua
          data={resumo.hoje}
          agua={resumo.agua}
          pesoKg={resumo.pesoAtual}
          acento={false}
        />
      </Revelar>

      <Revelar imediato atraso={140}>
        <Painel icone={CalendarCheck} rotulo="Semana">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] leading-none tabular-nums text-texto">
              {estado.numeroSemana}
            </span>
            <span className="text-[15px] text-auxiliar">
              {estado.semanasCumpridas}{" "}
              {estado.semanasCumpridas === 1 ? "cumprida" : "cumpridas"}
            </span>
          </div>

          {estado.faixaSemanas.length > 1 && (
            <FaixaSemanas faixaSemanas={estado.faixaSemanas} />
          )}

          {/* Os sete dias desta semana, linha por linha: ritual,
              inegociáveis, treino e água. Fica dentro do painel da Semana
              porque é a mesma pergunta — e um painel a menos na tela.

              Cuidado permanente: aqui não entra total, percentual da
              semana, nem comparação com a semana passada. A grade descreve
              o que aconteceu e para por aí. */}
          <div className="border-t border-filete pt-4">
            <QuadroDaSemana semana={resumo.semana} />
          </div>

          {/* Com sinal, e não só palavra: era a única coisa da linha que
              alguém vem conferir, e sumia no meio do cinza. */}
          {estado.feitoOntem !== null && (
            <MarcaFeito feito={estado.feitoOntem} rotulo="ontem" />
          )}
        </Painel>
      </Revelar>

      <Revelar atraso={40}>
        <Painel icone={Sun} rotulo="Hoje" href="/todo">
          {resumo.tarefas.total === 0 ? (
            <p className="text-[15.5px] leading-[1.5] text-auxiliar">
              Nada marcado para hoje.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[34px] leading-none tabular-nums text-texto">
                  {resumo.tarefas.faltam}
                </span>
                <span className="text-[15px] text-auxiliar">
                  {resumo.tarefas.faltam === 1 ? "restante" : "restantes"}
                </span>
              </div>
              <Barra
                feito={resumo.tarefas.total - resumo.tarefas.faltam}
                total={resumo.tarefas.total}
              />
            </>
          )}
        </Painel>
      </Revelar>

      {resumo.temTreinos && (
        <Revelar atraso={80}>
          <Painel icone={Dumbbell} rotulo="Treino" href="/saude">
            {resumo.treino ? (
              <>
                <p className="text-[20px] leading-[1.25] text-texto">
                  {resumo.treino.nome}
                </p>
                <ParValor
                  valor={String(resumo.treino.exercicios)}
                  rotulo={
                    resumo.treino.exercicios === 1 ? "exercício" : "exercícios"
                  }
                />
              </>
            ) : (
              <p className="text-[15.5px] leading-[1.5] text-auxiliar">
                Hoje é descanso.
              </p>
            )}
          </Painel>
        </Revelar>
      )}

      {resumo.pesoAtual !== null && (
        <Revelar atraso={120}>
          <Painel icone={TrendingUp} rotulo="Peso" href="/saude/evolucao">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[34px] leading-none tabular-nums text-texto">
                {kg(resumo.pesoAtual)}
              </span>
              <span className="text-[15px] text-auxiliar">kg</span>
              {resumo.gorduraAtual !== null && (
                <span className="ml-2">
                  <ParValor
                    valor={resumo.gorduraAtual.toFixed(1).replace(".", ",")}
                    rotulo="% de gordura"
                  />
                </span>
              )}
            </div>

            {/* Curva parada e sem âmbar: aqui ela é sinal de direção, e o
                âmbar desta tela já é o botão do ritual. Para arrastar e ler
                cada ponto, a Evolução está a um toque. */}
            {resumo.curvaPeso.length > 1 && (
              <div className="-mx-4 -mb-4 mt-1">
                <Grafico
                  pontos={resumo.curvaPeso}
                  acento={false}
                  descricao={`Peso nos últimos ${resumo.curvaPeso.length} registros.`}
                />
              </div>
            )}
          </Painel>
        </Revelar>
      )}

      <Revelar atraso={180} y={10} desfoque={3} className="pt-2">
        <Logo variante="rodape" />
      </Revelar>
    </div>
  );
}
