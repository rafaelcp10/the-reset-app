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
- Contraste: nada abaixo de 4.5:1 sobre **a superfície mais clara que
  existe hoje**, nem contorno de campo abaixo de 3:1. Em 2026-09-19 isso
  virou `superficie3` (#2a2d33), que os painéis passaram a usar em toda
  linha — e a medida de 2026-09-16, feita contra `superficie2`, ficou
  velha sem ninguém notar. Sobre a superfície nova, `auxiliar-fraco` dava
  4.10 e `auxiliar-minimo` 3.54.
  **`auxiliar-minimo` foi removido**: entre #2a2d33 e o branco não cabem
  três cinzas legíveis. `auxiliar-fraco` subiu para #96989d (4.78).
  **Criar superfície nova obriga a re-medir todos os cinzas sobre ela** —
  foi pular esse passo que deixou o app difícil de ler por três dias.
- Só existem **dois cinzas**: `auxiliar` e `auxiliar-fraco`.
- Nada de texto abaixo de 12.5px, nem ícone abaixo de 18px. O piso era
  11px e ainda custava esforço para ler: o app é usado com a vista cansada
  à noite, e rótulo em caixa alta com tracking largo cansa mais, não menos.
  Ícone pequeno é pior que texto pequeno — ele é alvo de toque e sinal de
  função ao mesmo tempo.
- Texto em botão âmbar é #101114, nunca branco.
- **"Feito" leva visto, e o visto é âmbar** (`components/MarcaFeito.tsx`).
  Uma palavra cinza no meio de outras palavras cinzas não se vê, e era o
  que acontecia com o resultado do dia. Verde foi cogitado e recusado: a
  paleta tem quatro cores e não vale abrir uma quinta por um ícone.
  **"Não feito" não ganha sinal de erro** — nem vermelho, nem X, nem
  risco: um traço neutro e a palavra. É a regra mais fácil de quebrar
  justamente aqui, onde toda outra interface do mundo põe vermelho.
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

O campo de escrever tarefa nova fica **dentro do painel de Hoje**, depois
da lista, e não no rodapé da tela: ele estava depois de tudo, longe da
lista em que a tarefa ia aparecer.

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
- **A aba abre mostrando, não pedindo** (2026-09-18). O formulário estava
  no topo e sobrevivia ali depois de preenchido, então a tela pedia antes
  de mostrar. Ele foi para `/saude/evolucao/nova-medida`, aberto por um "+"
  no cabeçalho do painel — e não por engrenagem, porque o cabeçalho da
  Saúde já tem uma, que abre os ajustes de treino. Duas engrenagens na
  mesma tela levando a lugares diferentes é convite para tocar na errada.
  Tela própria, e não bloco que abre no lugar: com o teclado do celular
  aberto sobra meia tela.
- A ordem é **Composição, Peso, Fotos, Cargas, Presença**. A composição
  lidera porque é o que a fita produziu; o peso tem painel próprio logo
  abaixo. Sem nenhuma medida, o "+" sozinho não explicaria nada, então o
  convite é escrito.
- O seletor de período desceu para baixo da nota: no cabeçalho ele
  disputava espaço com a ação, e em 375px os dois não cabem.
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

### A Home virou painel de controle (2026-09-18)

Decisão do Rafael, com a ressalva registrada: eu recomendei manter a Home
como **soleira** — frase grande e a porta do ritual, com poucos painéis
abaixo. Ele escolheu o resumo do dia inteiro. O que ficou:

- A frase de identidade **encolheu** (`tamanho="cabecalho"`, 19px) mas
  continua sendo a primeira coisa e continua na fonte das frases. Ela é o
  motivo de o app existir; os painéis são o que ele faz.
- O Ritual é o primeiro painel, o único com botão e a única aplicação de
  âmbar da tela.
- Semana, Hoje, Treino e Peso são painéis com seta, cada um com uma linha
  da sua área. A curva do Peso é **parada e sem âmbar** — aqui ela é sinal
  de direção; arrastar e ler cada ponto é na Evolução.
- "Objetivos" saiu. Era um cartão trancado permanente, e cartão que nunca
  responde ensina a ignorar cartão. Volta quando existir.
- A contagem de tarefas vem de `buscarEstadoTodo`, a mesma função que monta
  a aba — **nunca de uma versão enxuta**. A regra de "o que cai hoje" tem
  casos demais, e um número errado na primeira tela é pior que uma consulta
  a mais.
- `Grafico` aceita ser só desenho: sem `aoSelecionar`, não vira slider.

## Nutrição (aba de Saúde, 2026-09-18)

Os números do dia, e a água. **Não registra o que foi comido** — decisão
do Rafael entre três opções. Sem contador de calorias, sem barra de
progresso de comida, sem nota no fim do dia: a tela diz quanto comer e
some da frente.

- A conta **nasceu** como cópia fiel da planilha dele, conferida contra os
  doze valores dela. Em 2026-09-18 ele achou os números altos e pediu
  pesquisa; três coisas mudaram, e a pesquisa mostrou que o problema não
  era onde parecia:
  - **O basal não estava inflado.** 1.878 contra 1.762 do Mifflin-St Jeor
    e 1.915 do Katch-McArdle — entre os dois padrões. Mesmo assim passou a
    usar **Katch-McArdle quando a massa magra é conhecida**, porque é o
    método construído para quem sabe o próprio percentual de gordura, e a
    Evolução já coleta isso.
  - **A corrida estava 48% alta.** Virou 1 kcal por quilo por quilômetro,
    a estimativa consagrada. Sem idade e sem fator de biotipo.
  - **O corte do objetivo passou a incidir sobre o total**, não só sobre o
    basal. Antes o exercício entrava inteiro depois do corte, e o déficit
    percentual encolhia justamente nos dias de mais treino: 20% no
    descanso contra 14% no dia de treino e corrida.
  - O gasto de **treino continua na constante da planilha**: dá 13% a mais
    que 6 MET, dentro da margem desse tipo de estimativa, e musculação não
    tem número consagrado como o da corrida.
- **O corte incide sobre o gasto, nunca sobre o basal.** Era essa confusão
  que estava por trás de "os números estão altos": cortar 20% do basal
  poria a pessoa a comer abaixo do que o corpo queima parado.
- **O número do objetivo é o principal da tela, e o basal não aparece.**
  Cheguei a pôr um painel "O seu gasto" com o basal em número grande; o
  Rafael pediu para tirar, e tem razão — quem abre a aba quer saber quanto
  comer, não estudar o próprio metabolismo. O gasto do dia sobrou como uma
  linha ("Você gasta 2.317 kcal hoje"), porque "20% abaixo do gasto"
  precisa de um gasto à vista para querer dizer alguma coisa.
- **Corte de 20% para perder** (faixa recomendada 15–25%) e **acréscimo de
  15% para ganhar** (faixa 5–15%; era 20%, acima do recomendado — o que
  passa disso vira gordura, não músculo).
- **Piso de segurança**: o alvo nunca desce abaixo do basal, nem abaixo de
  1.500 kcal para homens e 1.200 para mulheres, vale o maior. Quando o piso
  entra, a tela diz. Só existe para baixo — ganhar massa nunca esbarra.
- **Limite conhecido**: o fator de biotipo endomorfo é 1,0, o que como
  fator de rotina significa "o dia inteiro gasta o mesmo que o corpo
  parado" — fisiologicamente impossível. Na prática o piso de segurança
  absorve isso, mas um endomorfo em déficit fica sem corte nos dias de
  descanso. Mexer nisso muda a escala inteira da planilha, então fica
  registrado em vez de corrigido em silêncio.
- O fator de biotipo **funciona como fator de rotina**, não de fisiologia:
  1,4/1,2/1,0 caem na faixa dos fatores de atividade de qualquer
  calculadora de TDEE, e o exercício entra depois, por fora.
- **Os fatores de biotipo são dois, e diferentes**: 1,4/1,2/1,0 no basal,
  1,2/1,1/1,0 no gasto de treino e corrida. Parece engano e não é — está
  assim nas duas fórmulas dela.
- **Proteína por quilo de massa magra; gordura por quilo de peso total.**
  Os denominadores são diferentes de propósito. Trocar um pelo outro muda
  a conta em dezenas de gramas.
- O biotipo é perguntado dentro da aba, como o sexo na Evolução: multiplica
  o basal em até 40% e não há padrão razoável. A descrição de cada um é o
  que se vê no espelho, sem uma palavra de fisiologia.
- `saude_geral` vira "manter" — é o único dos três que não empurra ninguém.
- **Tudo que se configura mora na engrenagem da Saúde** (2026-09-19):
  objetivo, biotipo, tamanho da garrafa, corrida, proteína e gordura por
  quilo, tempo de treino, local e limitações. O painel "A sua conta", que
  vivia no fim da aba de Nutrição, saiu — duas casas para a mesma coisa
  ensinam a não confiar em nenhuma.
- **As calorias de cada tipo de dia são editáveis, com "Redefinir"**. A
  conta sugere; quem conhece o próprio corpo corrige. Redefinir **apaga**
  o valor escrito em vez de copiar a sugestão para cima dele: apagado, o
  alvo volta a acompanhar peso, treino e objetivo sozinho; copiado, ele
  congelaria no número de hoje.
- **O objetivo mora dentro do painel "Quanto comer", acima dos números**,
  e também na engrenagem da Saúde. É o controle que mais mexe no resultado
  — 35% entre as pontas — e ele começou escondido no perfil, depois no fim
  da tela de Nutrição. Nos dois lugares o Rafael não achou, e passou dias
  com a conta em "ganhar massa". Controle que muda muito fica onde o que
  muda aparece.
- Os rótulos são **"Perder gordura", "Manter o peso", "Ganhar massa"** —
  perder *peso* inclui perder músculo, que é o contrário do que quem
  escolhe essa opção quer. O valor no banco continua `perder_peso`, porque
  a coluna já existia e renomear não muda nada.
- A duração do treino vem do **cronômetro real** quando houve sessão hoje;
  senão, do tempo declarado no perfil; senão, uma hora. A corrida o app não
  registra, então é um padrão que a pessoa declara. **As duas aparecem
  escritas na tela e são editáveis ali**: 15 minutos a mais de treino mudam
  a conta em mais de cem calorias, e isso ficava invisível.
- **Conferido contra duas referências externas** (2026-09-18), com peso 89,
  altura 176, 42 anos, mesomorfo: basal do app 1.931 contra 1.877 da
  calculadora da Growth e 1.911 da planilha — 3% de diferença. O gasto de
  1h de treino bate exatamente com a planilha (668). A média semanal do app
  em déficit dá 2.295 contra 2.327 da Growth e 2.271 da planilha. A conta
  não está inflada; o que estava errado era o objetivo salvo no perfil.
- Sem fita ainda, a proteína sai do peso total, e a tela **diz isso** em vez
  de esconder.

### Água

Contada em **garrafas**, não em litros: litro é unidade de rótulo, garrafa
é unidade de gesto. Quem está em pé na cozinha não sabe o que são 3,1
litros. Por isso o tamanho da garrafa é a primeira coisa perguntada.

Guardada em ml, para trocar de garrafa não reescrever o passado. Meta de
35 ml/kg, arredondada aos 50 ml — "3.115 ml" tem precisão que a conta não
tem. O número grande é **quantas faltam**, como no painel de tarefas.
Passar da meta não vira nada: nem parabéns, nem barra transbordando.

### O lembrete de água é o mais barulhento do app

De três em três horas, das 8h às 20h — **cinco por dia contra o único que
existia**. Duas defesas, e as duas são obrigatórias:

- **Para assim que a meta é batida.** Cinco cobranças para quem já bebeu
  tudo é o caminho mais curto para a pessoa desligar a notificação inteira.
- **Não tem interruptor próprio**, como os outros: o interruptor é ter dito
  o tamanho da garrafa. Quem nunca abriu a aba nunca recebe nada.

Os três lembretes da Saúde moram na mesma rota (`api/cron/lembretes`). A
água nunca cai às 9h, então nunca se encontra com fita e foto.

## O cron não é pontual (2026-09-18)

O workflow está configurado para rodar de 30 em 30 minutos e o GitHub
Actions o roda **de 2 em 5 horas** — agendamento lá é "melhor esforço", e
intervalo curto é engolido quando a plataforma está carregada. Medido nos
horários reais dos runs: 4h18, 5h17, 4h58, 2h00, 2h53.

As rotas exigiam estar **dentro de 30 minutos** do horário alvo. A janela
era perdida quase sempre, e a notificação noturna quase nunca saía. Isso
nunca funcionou direito — o YAML quebrado só piorou um defeito que já
existia.

O que mudou:

- A pergunta deixou de ser "estou na janela?" e passou a ser **"o horário
  já passou e eu ainda não avisei?"**. `lib/push/janela.ts` faz a conta no
  dia da pessoa, que vira às 3h — sem isso, um check-in de 21h30 com o cron
  rodando à 1h daria "faltam 20 horas" em vez de "passaram 3h30".
- **Teto de atraso**: 3h para o check-in e a manhã, 2h para a água. Sem
  teto, um check-in de 21h30 viraria notificação às 2h da manhã.
- **`lembretes_enviados`** é a memória. Sem ela, um cron que roda três
  vezes depois do horário manda três notificações iguais.
- **As rotas recusam mandar se a tabela não existir** (503), em vez de
  reenviar a cada tick. A água, com cinco horários por dia, viraria dezenas.
- Da água vale só o **último horário vencido**: perdidos os das 8h e das
  11h, sai um aviso às 14h e não três. Os anteriores são registrados como
  avisados sem aviso — um lembrete das 8h entregue às 19h não ajuda.

**Isso melhora muito a entrega, mas não resolve sozinho.** Com o cron
caindo de 2 em 5 horas, ainda dá para perder um dia. A correção completa é
tirar o disparo do GitHub Actions e pôr num agendador que cumpra horário.

## Música (2026-09-19)

O app **não integra com o Spotify**, e isso é decisão fechada, não falta de
tempo. Desde fevereiro de 2026 um app de terceiro em modo de
desenvolvimento aceita **cinco usuários**, todos Premium; passar disso
exige "extended quota", que pede empresa registrada e **250 mil usuários
ativos por mês**. Para um produto que vai ser vendido, não existe caminho.

Os outros caminhos foram descartados com motivo:
- **Embed do Spotify**: 30 segundos para quem não é Premium logado, e
  **não permite autoplay** — o som só começa com um toque dentro do iframe.
- **YouTube**: os termos da API proíbem explicitamente tocar em segundo
  plano, tocar só o áudio e esconder o player. É exatamente o que a gente
  faria.
- **Hospedar o arquivo do usuário**: exposição real de direito autoral num
  produto comercial.

O que ficou:

- As cinco vagas guardam o **link** da música. Cola-se o link do Spotify e
  o nome aparece sozinho, pelo **oEmbed** — que é público e não precisa de
  API nem conta. Falhando o oEmbed, a música é salva e a lista mostra o
  link: pior, e melhor que recusar o que a pessoa colou.
- O link é normalizado: `spotify:track:`, `/intl-pt/` e o `?si=` viram a
  mesma URL canônica. O `?si=` é identificador de quem compartilhou e não
  tem por que ficar guardado.
- Qualquer outro serviço também serve. O app só guarda e abre.

### Misturar a voz com a música

`navigator.audioSession.type` decide, e **não dá para ter as duas coisas**:

- `"playback"` ignora o interruptor de silencioso — foi o que consertou a
  respiração não tocar — mas **interrompe** a música de outro aplicativo.
- `"transient"` o WebKit mapeia para sessão misturável: a música continua e
  a voz entra por cima, **ao preço de voltar a obedecer ao interruptor**.

Por isso é preferência, e não automatismo: o navegador não enxerga o áudio
de outro app, e quem liga isso está dizendo "eu ponho música antes" — quem
põe música não está no silencioso. A opção só aparece para quem tem música
salva, e a tela avisa do preço quando ela é ligada.

## Ler a linha de `usuarios` com `*`, nunca com lista de colunas

O PostgREST **derruba o select inteiro** quando uma das colunas pedidas não
existe. Numa lista de quinze colunas, uma migration ainda não rodada faz a
consulta voltar 400, `usuario` virar nulo, e a tela inteira parecer vazia —
como se nada tivesse sido preenchido, com todos os dados salvos no banco.

Aconteceu em 2026-09-20 na Nutrição: `calorias_descanso` não existia ainda,
e a tela pedia biotipo, sexo, nascimento e altura, todos já preenchidos. O
Ritual estava quebrado junto, pelo mesmo motivo, e ninguém tinha notado.

`select("*")` na linha de `usuarios` resolve a classe inteira: coluna que
ainda não existe simplesmente não vem, e o campo fica vazio em vez de
derrubar o resto. É uma linha só, o custo é nenhum.

**A ordem certa continua sendo migration antes do deploy.** Isto é a rede
por baixo, para quando a ordem escorregar — e ela escorregou três vezes.

Em 2026-09-21 a varredura pegou mais três: `lib/home/resumo.ts` e
`lib/home/dados.ts` (que derrubariam a Home inteira) e a tela de Ajustes.
Todas passaram a `*`.

**A regra vale para toda leitura de uma linha de `usuarios` que monte uma
tela.** As rotas de cron seguem com lista de colunas de propósito: elas
varrem a tabela inteira, `*` ali custa de verdade, e cron quebrado aparece
no log — tela em branco não aparece em lugar nenhum.

## Os inegociáveis atravessam a semana (2026-09-20)

Eles são guardados por semana (`compromissos.semana_inicio`), e na virada
do domingo a consulta deixava de achar os da semana anterior: os três
sumiam da tela. **Nunca foi a intenção.** A revisão de domingo existe para
lembrar de planejar a semana, não para apagar o que já valia — e na
prática os três costumam ser os mesmos.

`lib/ritual/inegociaveis.ts` copia os da última semana que teve algum para
a semana atual, na primeira leitura de tela da semana. Não é
necessariamente a semana de sete dias atrás: quem passou duas semanas sem
abrir o app não perde os seus três por isso.

**A marca `usuarios.inegociaveis_copiados_para` é o que faz isso rodar uma
vez por semana**, e ela não é detalhe. Limpar um slot **apaga a linha**,
então "semana nova, ainda vazia" e "esvaziei os três de propósito" são a
mesma consulta vazia. Sem a marca, o que a pessoa apagasse voltaria na
próxima leitura de tela.

A cópia é `upsert` com conflito em (usuário, semana, ordem) — restrição
que a tabela já tinha — então nunca sobrescreve o que já existe na semana
atual.

### A Home ganhou a água e o quadro da semana (2026-09-21)

O app instalado abria no `/ritual` — era o `start_url` do manifesto. Passou
a abrir na Home: abrir direto no espelho pulava tudo o que a Home resume,
inclusive a água, que é o que se toca mais vezes por dia. **Quem já
instalou continua abrindo no ritual até reinstalar** — o iPhone lê o
manifesto na hora da instalação e não volta a ler.

- **A água é o segundo painel, logo depois do Ritual**, e não o último. É a
  outra coisa da Home que se *faz* em vez de se ler, e a que se faz mais
  vezes por dia; estava a três toques, dentro da Nutrição. É o mesmo
  `ContadorAgua`, com `acento={false}`: o âmbar da Home é o botão do
  espelho, e a regra é uma função de acento por tela.
- **O quadro da semana mora dentro do painel Semana**
  (`components/home/QuadroDaSemana.tsx`), abaixo da faixa — é a mesma
  pergunta, e é um painel a menos na tela. Sete dias, uma linha por coisa:
  Ritual, cada inegociável, Treino e Água. Mesma gramática de pontos da
  Academia: cheio é feito, contornado é dia que passou em branco, pontinho
  é dia sem nada previsto. Pontinho e não disco cinza cheio — com seis
  linhas, um disco por dia vazio viraria ruído e pareceria mais um estado.
- **Hoje é pontinho enquanto não for feito, nunca contorno.** O dia ainda
  está aberto, e cobrar às dez da manhã por algo que ainda cabe no dia é
  exatamente o que este app não faz. A coluna de hoje se distingue pelo
  traço embaixo da abreviação, não pelo estado dos pontos.
- **`esperado` é o que separa "não fiz" de "não era para fazer"**: domingo
  sem treino marcado não é treino perdido, e dia anterior à criação da
  conta não é ritual perdido. Sem isso, a grade de quem acabou de entrar
  viria contornada de ponta a ponta.
- O que **não** entra nessa grade, e é o risco permanente dela: total da
  semana, percentual, comparação com a semana passada, recorde, e cor que
  muda conforme o quanto falta. Ela descreve o que aconteceu e para aí.
- **Os inegociáveis da grade saem de `buscarEstadoTodo`**, nunca de uma
  consulta própria: é ela que copia os da semana passada na virada do
  domingo, e uma consulta paralela chegaria antes da cópia — a Home
  mostraria a semana vazia até alguém recarregar.

## Privacidade
Os textos do usuário são pessoais. Nunca em log, nunca em analytics,
nunca em tela que não seja a do próprio usuário.

O mesmo vale, com mais rigor ainda, para os dois arquivos que o app
guarda: a voz gravada nas frases e a foto de antes e depois. Bucket
privado, pasta por usuário, URL assinada de vida curta, e exclusão junto
com a conta. Foto de corpo é o dado mais sensível que este app guarda.

## Comandos
npm run dev / npm run build / npm run lint