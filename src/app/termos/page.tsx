import type { Metadata } from "next";
import PaginaLegal, { Secao } from "@/components/legal/PaginaLegal";

export const metadata: Metadata = {
  title: "Termos de uso · The Reset",
  description: "As regras de uso do The Reset.",
};

const CONTATO = "rafael.piresweb@gmail.com";

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de uso" atualizadoEm="9 de setembro de 2026">
      <Secao titulo="O que é o The Reset">
        <p>
          Um app de ritual diário. De manhã você lê cinco frases em voz alta
          e escolhe uma coisa para fazer no dia; de noite marca o que fez.
          Ele guarda o que é seu e devolve no dia seguinte. É isso.
        </p>
        <p>
          Ao usar o app, você concorda com estes termos. Se não concordar,
          basta não usar.
        </p>
      </Secao>

      <Secao titulo="Não é tratamento de saúde">
        <p>
          O The Reset não é serviço de saúde, não faz diagnóstico e não
          substitui acompanhamento médico, psicológico ou psiquiátrico. As
          frases são escritas por você, para você.
        </p>
        <p>
          Se você está passando por sofrimento intenso, procure ajuda
          profissional. No Brasil, o CVV atende de graça pelo 188, 24 horas
          por dia.
        </p>
      </Secao>

      <Secao titulo="O conteúdo é seu">
        <p>
          As frases, as linhas do dia, as tarefas e as gravações continuam
          sendo suas. Não reivindicamos propriedade sobre nada disso e não
          usamos esse conteúdo para nenhuma finalidade além de mostrar de
          volta para você dentro do app.
        </p>
      </Secao>

      <Secao titulo="Sua conta">
        <p>
          A conta pode ser anônima ou vinculada a um e-mail. Você é
          responsável por guardar o acesso: numa conta anônima, limpar os
          dados do navegador apaga o caminho de volta, e não temos como
          restaurar o que se perdeu.
        </p>
        <p>
          Não crie conta para outra pessoa nem use o app para guardar
          conteúdo de terceiros sem que eles saibam.
        </p>
      </Secao>

      <Secao titulo="Disponibilidade">
        <p>
          O app é oferecido gratuitamente, no estado em que se encontra, sem
          garantia de funcionamento ininterrupto. Ele pode sair do ar,
          apresentar falhas ou mudar de funcionalidades. Faremos o possível
          para avisar antes de mudanças relevantes, mas não prometemos
          continuidade nem garantimos que nenhum dado será perdido por falha
          técnica.
        </p>
        <p>
          Recomendamos guardar o acesso por e-mail justamente por isso.
        </p>
      </Secao>

      <Secao titulo="Uso aceitável">
        <p>
          Não tente invadir, sobrecarregar ou burlar os limites do serviço,
          acessar dados de outras pessoas, nem usar o app para atividade
          ilegal. Contas que fizerem isso podem ser encerradas.
        </p>
      </Secao>

      <Secao titulo="Encerramento">
        <p>
          Você pode parar de usar quando quiser e pedir a exclusão de tudo
          pelo endereço no fim desta página. Podemos encerrar contas em caso
          de uso abusivo ou se o serviço for descontinuado — neste último
          caso, com aviso prévio razoável.
        </p>
      </Secao>

      <Secao titulo="Limite de responsabilidade">
        <p>
          O app é uma ferramenta de organização pessoal. As decisões que você
          toma a partir do que escreve são suas. Na medida permitida pela
          lei, não respondemos por prejuízos decorrentes do uso ou da
          indisponibilidade do serviço.
        </p>
      </Secao>

      <Secao titulo="Mudanças nestes termos">
        <p>
          Se estes termos mudarem, a data no topo é atualizada. Continuar
          usando o app depois disso significa concordar com a nova versão.
        </p>
      </Secao>

      <Secao titulo="Lei aplicável">
        <p>
          Estes termos são regidos pelas leis brasileiras, e o foro é o da
          comarca de domicílio do usuário.
        </p>
      </Secao>

      <Secao titulo="Contato">
        <p>
          <span className="text-texto">{CONTATO}</span>
        </p>
      </Secao>
    </PaginaLegal>
  );
}
