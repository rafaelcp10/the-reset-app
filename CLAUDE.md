# THE RESET

App de ritual diário. A pessoa lê cinco frases em voz alta de manhã,
escolhe uma coisa para fazer hoje, e confirma à noite. A escolha sai do
que já está no dia — o que ficou dito ontem à noite e as tarefas do
to-do; escrever do zero existe, mas como último recurso.

## Stack
Next.js (App Router) + Supabase (Postgres + auth por e-mail) + Vercel.
Web Push com VAPID. Cron para a notificação noturna.
PWA instalável. Sem app nativo, sem loja.

## Regras de produto que NUNCA podem ser quebradas
- Nunca usar vermelho para comportamento do usuário. Vermelho só para
  erro de sistema.
- Contagem sempre em SEMANAS cumpridas. Nunca dias corridos, nunca streak.
- Falhar não zera nada. "Não fiz" é registro válido, não dado ausente.
- O app NUNCA gera, sugere ou adiciona frases. Só o usuário escreve.
- Nenhum placar, pontuação, ranking, medalha, badge ou comparação entre
  usuários.
- Nenhuma justificativa científica na interface.
- O dia vira às 3h, não à meia-noite. A semana começa no domingo.
- Check-in noturno resolvido em menos de 5 segundos. No iPhone isso é dois
  toques, não um: o Safari ignora `actions` em notificação (`maxActions` é
  zero), então Fiz/Não fiz não existem no banner. A notificação aponta para
  a âncora do check-in e abre com os botões na frente.

## Regras de código
- Mobile primeiro. Uma coluna.
- Ícones apenas da biblioteca Lucide.
- Cores: #101114 (fundo), #F7F7F5 (texto), #A2A4A7 (auxiliar),
  #C97B3A (acento, uma aplicação por tela).
- Contraste: nada abaixo de 4.5:1 sobre o fundo mais claro do app
  (`superficie2`), nem contorno de campo abaixo de 3:1. Os cinzas foram
  recalibrados em 2026-09-16 por isso — `auxiliar` era #8A8C8F e ficava em
  5.2, mas `auxiliar-fraco` e `auxiliar-minimo` estavam em 3.2 e 2.6.
- Nada de texto abaixo de 12.5px, nem ícone abaixo de 18px. O piso era
  11px e ainda custava esforço para ler: o app é usado com a vista cansada
  à noite, e rótulo em caixa alta com tracking largo cansa mais, não menos.
  Ícone pequeno é pior que texto pequeno — ele é alvo de toque e sinal de
  função ao mesmo tempo.
- Texto em botão âmbar é #101114, nunca branco.
- Tipografia: Archivo (frases) e Inter (interface), via Google Fonts.
- Nenhuma imagem, foto, ilustração ou mascote em nenhuma tela.

## Linguagem visual (revisada em 2026-09-08)
O handoff original proibia gradiente, sombra e movimento. Isso foi
**afrouxado de propósito** para dar profundidade ao app — o que continua
valendo é a lista acima, que não mudou. O que passou a ser permitido:

- Gradiente, sombra, brilho e desfoque, **desde que sirvam à profundidade**
  (separar planos) e não virem decoração ou segundo acento.
- Movimento: revelações na entrada, parallax e escalonamento. Toda animação
  respeita `prefers-reduced-motion`.
- Fundo vivo (`components/movimento/Atmosfera.tsx`): luz âmbar, bruma que
  deriva devagar, vinheta e grão. **Continua sem nenhuma imagem** — é tudo
  gradiente e turbulência SVG, para não pesar no PWA offline.

### Blocos (revisado em 2026-09-16)

A proibição de "cartão com borda, sem divisória" **saiu**. Ela vinha do
handoff e servia a uma tela que se lê sentado; a Academia mostrou o limite
dela — aquela aba se usa em pé, no meio de uma série, com o celular longe
do rosto, e ali o alvo de toque precisa de contorno próprio.

O que substitui a regra:

- Bloco se separa do fundo por **elevação** (`.bloco`, `.bloco-vez` no
  globals.css): superfície um tom mais clara e sombra. **Borda continua
  fora** — não porque é proibida, mas porque elevação já resolve e borda
  soma peso sem somar informação.
- Vale onde o uso justifica. A Academia usa; Ritual e To-do seguem na
  coluna limpa até haver motivo, e não por inércia.

Duas regras novas que nasceram daí:
- Bloco acima da dobra entra por animação CSS (`imediato` no `Revelar`),
  nunca por IntersectionObserver: se a hidratação demora, a tela não pode
  ficar vazia.
- O âmbar continua tendo **uma aplicação por tela**. Brilho e sombra são luz
  sobre a paleta existente, não cor nova.

## Privacidade
Os textos do usuário são pessoais. Nunca em log, nunca em analytics,
nunca em tela que não seja a do próprio usuário.

## Comandos
npm run dev / npm run build / npm run lint