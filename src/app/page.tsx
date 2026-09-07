import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoHome } from "@/lib/home/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import Logo from "@/components/Logo";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";
import FaixaSemanas from "@/components/home/FaixaSemanas";

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
    <div className="flex flex-col gap-14 px-[26px] pb-[30px] pt-[56px]">
      <FraseIdentidadeRitual
        textoBase={identidade?.texto ?? FRASES_PADRAO.identidade.texto}
        preenchimento={identidade?.preenchimento_lacuna ?? ""}
        caminhoAtual={CAMINHO}
        tamanho="home"
        editavel={false}
      />

      <div className="flex flex-col gap-3">
        <FaixaSemanas faixaSemanas={estado.faixaSemanas} />
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
      </div>

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
          className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Entrar no espelho
        </Link>
      )}

      <div className="flex flex-col gap-6">
        <PreviaBloqueada
          titulo="To-do"
          texto="As tarefas do dia, separadas dos inegociáveis."
        />
        <PreviaBloqueada
          titulo="Objetivos"
          texto="O que você está construindo em meses, não em dias."
        />
        <PreviaBloqueada
          titulo="Academia"
          texto="Os treinos da semana e o registro de cada um."
        />
      </div>

      <Logo variante="rodape" />
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
