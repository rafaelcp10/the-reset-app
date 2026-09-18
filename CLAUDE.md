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
- Nenhuma imagem, foto, ilustração ou mascote em nenhuma tela — **com uma
  exceção, aberta em 2026-09-18 e descrita abaixo**: a foto de antes e
  depois na Evolução. Ilustração, mascote, ícone desenhado, foto de banco
  de imagens e qualquer arte de produto continuam fora, sem exceção.

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
- O âmbar tem **uma aplicação por tela** — revisado em 2026-09-18 para
  "uma **função** por tela", não um elemento. Na Evolução as duas curvas são
  âmbar porque são a mesma função (a série que se arrasta); seriam duas
  aplicações se uma fosse curva e a outra, botão. Brilho e sombra continuam
  sendo luz sobre a paleta existente, não cor nova.

### Número e curva (2026-09-18)

A Evolução era parede de texto: "São 1,1 kg de diferença, em 4 registros"
é uma frase para um dado que cabe em dois números. Esta aba se abre para
conferir, não para ler, e ler frase cansa mais que ler número.

O que substituiu:

- **`components/saude/Metrica.tsx`**: rótulo pequeno, número grande,
  uma linha de nota, e a curva sangrando até a borda do bloco. A curva é
  fundo do número, não elemento ao lado dele.
- **`components/saude/Grafico.tsx`**: SVG escrito à mão, sem biblioteca —
  o PWA precisa abrir offline, e uma lib de gráfico pesa mais que cem
  linhas. Sem eixo, sem grade, sem zero forçado na base, sem cor que muda
  conforme a direção: a curva descreve o caminho, não julga. Vermelho e
  verde por direção estão fora por regra, e continuariam fora sem ela.
- **`components/saude/PainelSerie.tsx`**: a curva se arrasta com o dedo, e
  o número grande obedece ao ponto escolhido. Foi isso que substituiu a
  lista de dez pesagens em texto. O ponto fica onde a pessoa soltou — não
  "volta ao normal", porque conferir uma medida de três meses atrás é
  motivo legítimo para abrir a aba.
- **O seletor de período abre em "Tudo"**, ao contrário do Zepp, que abre no
  período mais curto. A pergunta desta aba é "como comecei e como estou":
  abrir em três meses esconde metade da resposta. E ele só aparece quando
  há período para escolher.
- Painéis pequenos em grade de dois, sem curva e sem data na nota — data
  não cabe numa linha ali, e quebrar em duas desalinha as alturas.

### O vocabulário da Saúde (2026-09-18)

Cinco peças, em `components/saude/`, e a intenção é que o app inteiro
passe a falar por elas:

- `Painel` — bloco com cabeçalho de **ícone + rótulo em caixa alta**. O
  ícone chega antes da palavra quando se varre a tela com o polegar. Com
  `href`, o painel inteiro vira alvo e a seta fica no cabeçalho: meia tela
  de alvo é mais honesto que uma seta de 20px.
- `LinhaDoPainel` — linha dentro do painel, uma superfície acima dele.
  Mesma gramática de elevação, um nível abaixo.
- `Barra` — "3 de 4". O denominador **nunca é meta do app**: é sempre algo
  que a pessoa declarou. Sem cor que muda conforme o quanto falta e sem
  barra cheia comemorando.
- `ParValor` — "6 EXERCÍCIOS": número forte, rótulo apagado, lado a lado.
  Cabe mais numa linha do que em frase, e a vista pega o número primeiro.
- `Metrica` e `PainelSerie`, descritos acima.

As abas viraram pílulas, como no Zepp.

O To-do passou a falar por elas em 2026-09-18: Inegociáveis, Hoje, Esta
semana e O mês são painéis, e os períodos do dia viram sub-blocos dentro
deles. O painel de Hoje conta **o que falta**, não o que foi feito — a
lista existe para mostrar o que ainda está de pé, e zerada ela diz zero,
que é a única comemoração que cabe. A barra é cinza porque o âmbar dessa
tela pertence à marcação.

Texto de tarefa quebra em duas linhas em vez de cortar com reticências: o
fim da frase costuma ser o que diz o que fazer, e "Responder o e-mail do
con…" não serve para nada.

A referência é o Zepp, e é só de layout: número primeiro, curva embaixo,
painel como unidade. O conteúdo dele — prontidão, nota, elogio — continua
fora, pelo motivo de sempre: descrever não é julgar.

**O quadro da semana é o lugar mais fácil de virar streak sem perceber.**
Ele mostra os sete dias desta semana e nada mais: não encadeia semanas, não
zera, não guarda recorde. Dia marcado que passou em branco fica
**contornado — nunca riscado, nunca vermelho**, porque "não fiz" é registro
válido e não falta.

## Evolução (aba de Saúde, 2026-09-18)

Registro do que aconteceu, não placar. É o que a faz caber na regra de
"nenhum placar, pontuação, ranking ou comparação": não há meta, faixa de
"ideal", percentual de objetivo, nota nem seta de veredito, e a comparação
é sempre da pessoa com ela mesma. Carga que desceu aparece com o mesmo peso
visual de carga que subiu.

- O percentual de gordura é o método de circunferências da Marinha
  americana, na forma exata da planilha que o usuário já usava — inclusive
  o `+2` do ramo masculino, que a fórmula original não tem. Ele fica: trocar
  a conta faria os números novos deixarem de conversar com os antigos.
  Conferido contra os quatro registros reais da planilha, bate ao centésimo.
- As medidas guardam a própria altura em vez de lerem o perfil: editar a
  altura depois recalcularia o passado.
- O sexo só é perguntado na Evolução, porque a fórmula tem dois ramos e não
  há padrão razoável. Não aparece em nenhuma outra tela.
- Dois lembretes, ambos às 9h locais, na mesma rota
  (`api/cron/evolucao`): a fita é semanal e cai no domingo; a foto é mensal
  e conta um mês **a partir da última foto**, não do calendário — quem
  atrasa passa a ser lembrado na data nova. Caindo os dois na mesma manhã,
  sai uma notificação só. Nenhum dos dois tem interruptor próprio: o
  interruptor é ter medido, ou ter fotografado, alguma vez.
- O tutorial de medição é todo em texto. Um desenho de onde fica a cintura
  ajudaria, e mesmo assim não entra: a exceção de imagem vale para foto do
  usuário, não para ilustração.

### A exceção de imagem (2026-09-18)

A regra era "nenhuma imagem em nenhuma tela". Ela continua valendo em todo
o resto do app. O que passou a caber, e só isso:

- **Foto tirada pelo próprio usuário, mostrada só para ele, na Evolução.**

São **quatro ângulos por sessão** (frente, lado direito, costas, lado
esquerdo), porque uma foto de frente esconde justamente o que mais muda e
o que a pessoa menos vê no espelho. A tela mostra a primeira e a mais
recente **do mesmo ângulo**, e um botão gira o par inteiro — comparar a
frente de hoje com as costas de três meses atrás não diria nada. A ordem
do giro é a de quem gira o corpo, não a alfabética.

Cada ângulo tem a própria linha do tempo: quem começou a fotografar as
costas três meses depois tem um "antes" de costas que é o começo dele, não
um buraco.

As do meio ficam na galeria (`/saude/evolucao/fotos`), agrupadas por dia,
do mais novo para o mais antigo — o dia é a unidade porque é assim que a
sessão acontece. Apagar mora só lá, e pede dois toques: a foto de hoje se
tira de novo, a de um ano atrás não existe em lugar nenhum além dali.

O motivo: ver o próprio corpo em duas fotos diz o que 4 pontos percentuais
não dizem. Não é ilustração nem decoração — é dado do usuário, da mesma
natureza da voz gravada nas frases, que o app já guarda.

O que **não** foi aberto, e não deve ser aberto por analogia a isto:
ilustração, mascote, desenho explicativo, foto de banco de imagens, ícone
que não seja Lucide, imagem de marketing, imagem em qualquer outra aba.

Condições que vieram junto e não são negociáveis:
- Bucket privado, pasta por usuário, leitura só por URL assinada de 15
  minutos. Nunca bucket público, nunca URL permanente.
- Some junto com a conta (`lib/conta/exclusao.ts` apaga o arquivo antes de
  derrubar a linha — sem a linha, o caminho se perde).
- Nunca passa pelo otimizador de imagem do Next: isso jogaria foto de corpo
  num cache que não é do usuário.
- É reduzida no navegador antes de sair do aparelho (JPEG, 1200px no lado
  maior). Menos foto trafegando é menos foto exposta.

## Privacidade
Os textos do usuário são pessoais. Nunca em log, nunca em analytics,
nunca em tela que não seja a do próprio usuário.

O mesmo vale, com mais rigor ainda, para os dois arquivos que o app
guarda: a voz gravada nas frases e a foto de antes e depois. Bucket
privado, pasta por usuário, URL assinada de vida curta, e exclusão junto
com a conta. Foto de corpo é o dado mais sensível que este app guarda.

## Comandos
npm run dev / npm run build / npm run lint