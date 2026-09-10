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
- Check-in noturno resolvido em menos de 5 segundos.

## Regras de código
- Mobile primeiro. Uma coluna, sem cartão com borda, sem divisória.
- Ícones apenas da biblioteca Lucide.
- Cores: #101114 (fundo), #F7F7F5 (texto), #8A8C8F (auxiliar),
  #C97B3A (acento, uma aplicação por tela).
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