import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoHome } from "@/lib/home/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import Logo from "@/components/Logo";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";
import FaixaSemanas from "@/components/home/FaixaSemanas";
import Revelar from "@/components/movimento/Revelar";
import CamadaParallax from "@/components/movimento/CamadaParallax";

const CAMINHO = "/";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);
  const estado = await buscarEstadoHome(supabase, user.id);
  const { identidade } = estado;

  // "Vários dias sem abrir" — o exemplo do handoff usa 6 dias como cenário
  // de validação, por isso o limiar aqui. Não conta pra quem nunca abriu.
  if (estado.diasSemAbrir !== null && estado.diasSemAbrir >= 6) {
    redirect("/recomeco");
  }

  return (
    <div className="flex grow flex-col gap-14 px-[26px] pb-[30px] pt-[56px]">
      {/* Plano da frente: a frase sobe mais devagar que o resto da página,
          então ela "segura" enquanto o conteúdo abaixo desliza. */}
      <CamadaParallax fator={0.16} maximo={70}>
        <FraseIdentidadeRitual
          textoBase={identidade?.texto ?? FRASES_PADRAO.identidade.texto}
          preenchimento={identidade?.preenchimento_lacuna ?? ""}
          caminhoAtual={CAMINHO}
          tamanho="home"
          editavel={false}
          revelarPalavras
        />
      </CamadaParallax>

      <Revelar imediato atraso={120} className="flex flex-col gap-3">
        {estado.faixaSemanas.length > 1 && (
          <FaixaSemanas faixaSemanas={estado.faixaSemanas} />
        )}
        <p className="text-sm text-auxiliar">
          Semana {estado.numeroSemana} · {estado.semanasCumpridas}{" "}
          {estado.semanasCumpridas === 1
            ? "semana cumprida"
            : "semanas cumpridas"}
        </p>
        {estado.feitoOntem !== null && (
          <p className="text-sm text-auxiliar">
            Ontem · {estado.feitoOntem ? "feito" : "não feito"}
            {estado.linhaOntem ? ` — ${estado.linhaOntem}` : ""}
          </p>
        )}
      </Revelar>

      <Revelar imediato atraso={200}>
        {estado.espelhoFeitoHoje ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-auxiliar">
              Ritual de hoje, feito
              {estado.horaRegistroHoje ? ` às ${estado.horaRegistroHoje}` : ""}
            </p>
            <Link
              href="/ritual/espelho"
              className="text-sm text-auxiliar underline underline-offset-4"
            >
              entrar de novo
            </Link>
          </div>
        ) : (
          <Link
            href="/ritual/espelho"
            className="botao-acento tipo-rotulo block w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
          >
            Entrar no espelho
          </Link>
        )}
      </Revelar>

      <div className="flex flex-col gap-6">
        <Revelar imediato atraso={280} y={16}>
          <PreviaBloqueada
            titulo="Objetivos"
            texto="O que você está construindo em meses, não em dias."
          />
        </Revelar>
        <Revelar imediato atraso={340} y={16}>
          <PreviaBloqueada
            titulo="Academia"
            texto="Os treinos da semana e o registro de cada um."
          />
        </Revelar>
      </div>

      <Revelar imediato atraso={460} y={10} desfoque={3}>
        <Logo variante="rodape" />
      </Revelar>
    </div>
  );
}

function PreviaBloqueada({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="tipo-rotulo text-[11px] tracking-[.16em] text-auxiliar-fraco">
        {titulo}
      </h2>
      <p className="text-[13.5px] text-auxiliar-minimo">{texto}</p>
    </div>
  );
}
