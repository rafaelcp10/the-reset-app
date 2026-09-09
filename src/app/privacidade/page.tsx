import type { Metadata } from "next";
import PaginaLegal, { Secao } from "@/components/legal/PaginaLegal";

export const metadata: Metadata = {
  title: "Privacidade · The Reset",
  description: "O que o The Reset guarda, onde fica e quem vê.",
};

const CONTATO = "rafael.piresweb@gmail.com";

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Privacidade" atualizadoEm="9 de setembro de 2026">
      <Secao titulo="O resumo">
        <p>
          O The Reset guarda o que você escreve para devolver isso a você no
          dia seguinte. Nada do que está aqui dentro é vendido, compartilhado
          ou usado para te classificar. Não há anúncios, não há rastreadores
          de terceiros e não há analytics medindo o que você faz na tela.
        </p>
      </Secao>

      <Secao titulo="O que fica guardado">
        <p>
          As cinco frases e a palavra que você escolheu para a primeira
          delas. A linha de cada dia e a resposta de fiz ou não fiz. Os três
          inegociáveis da semana. As tarefas do to-do e as marcações de cada
          dia. O número de semanas cumpridas. Os links de música que você
          salvar. Suas preferências: horário do check-in, repetições por
          frase e modo de avanço.
        </p>
        <p>
          Se você ligar o check-in noturno, guardamos também o endereço de
          notificação que o seu navegador gera para aquele aparelho. Ele não
          identifica você e serve só para entregar o aviso.
        </p>
      </Secao>

      <Secao titulo="As gravações de voz">
        <p>
          Se você gravar a sua voz lendo uma frase, o áudio fica num
          repositório privado, separado por usuário. Ele não é público e não
          tem link permanente: cada vez que você abre o app, o servidor gera
          um endereço temporário que expira em uma hora e só funciona para
          você.
        </p>
        <p>
          Ninguém escuta essas gravações. Elas não são transcritas, não são
          analisadas e não treinam modelo nenhum.
        </p>
      </Secao>

      <Secao titulo="Sua conta">
        <p>
          Por padrão a conta é anônima: ela existe só no navegador deste
          aparelho e não tem seu nome nem seu e-mail. Isso tem um preço, e é
          melhor você saber — se limpar os dados do navegador ou trocar de
          celular sem guardar o acesso, esse conteúdo se perde e não há como
          recuperar.
        </p>
        <p>
          Se você guardar o acesso, passamos a ter o seu e-mail, usado
          apenas para te trazer de volta à sua conta. Se entrar com o Google,
          recebemos do Google o seu e-mail e o identificador da conta — nada
          além disso, e nenhum acesso aos seus contatos, arquivos ou
          qualquer outro serviço.
        </p>
      </Secao>

      <Secao titulo="Onde os dados ficam">
        <p>
          O aplicativo roda na Vercel e os dados ficam no Supabase, que usa
          infraestrutura de nuvem com servidores fora do Brasil. Ambos são
          fornecedores de infraestrutura: processam os dados para o app
          funcionar, não para uso próprio.
        </p>
        <p>
          O acesso é isolado por usuário no próprio banco, por políticas que
          impedem uma conta de ler as linhas de outra.
        </p>
      </Secao>

      <Secao titulo="O que não fazemos">
        <p>
          Não vendemos dados. Não compartilhamos com anunciantes. Não
          fazemos perfil comportamental. Não comparamos você com outras
          pessoas. Não usamos o que você escreve para treinar inteligência
          artificial. Não colocamos seus textos em log, em analytics, nem em
          qualquer tela que não seja a sua.
        </p>
      </Secao>

      <Secao titulo="Apagar tudo">
        <p>
          Você pode pedir a exclusão da sua conta e de tudo que está nela.
          Escreva para <span className="text-texto">{CONTATO}</span> a partir
          do e-mail vinculado à conta, e apagamos os registros e as
          gravações. Se a sua conta for anônima, limpar os dados do site no
          navegador já remove o seu acesso a ela.
        </p>
        <p>
          Pela LGPD você também pode pedir confirmação do tratamento, acesso
          aos dados, correção e portabilidade. O mesmo endereço serve.
        </p>
      </Secao>

      <Secao titulo="Menores">
        <p>
          O app é feito para maiores de 18 anos e não é direcionado a
          crianças ou adolescentes.
        </p>
      </Secao>

      <Secao titulo="Mudanças">
        <p>
          Se algo mudar, esta página muda junto e a data no topo é
          atualizada. Mudança que afete de verdade o que é guardado será
          avisada dentro do app.
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
