-- O que já foi avisado em cada dia.
--
-- Nasce de um defeito real: o cron do GitHub Actions está configurado para
-- rodar de 30 em 30 minutos e roda de 2 em 5 horas — agendamento no Actions
-- é "melhor esforço", e intervalo curto é engolido quando a plataforma está
-- carregada. As rotas exigiam estar dentro de 30 minutos do horário alvo,
-- então a janela era perdida quase sempre e a notificação noturna quase
-- nunca saía.
--
-- A correção é parar de depender de pontualidade que não controlamos: em
-- vez de "estou na janela?", a pergunta passa a ser "o horário já passou e
-- eu ainda não avisei?". Isso precisa de memória — e é esta tabela.
--
-- Sem ela, um cron que roda três vezes depois do horário mandaria três
-- notificações iguais.
create table lembretes_enviados (
  usuario_id uuid not null references usuarios (id) on delete cascade,
  data date not null,
  -- 'checkin', 'evolucao', 'agua_8', 'agua_11', 'agua_14', 'agua_17',
  -- 'agua_20'. A água guarda a hora no tipo porque são cinco por dia, e
  -- perder uma não pode calar as seguintes.
  tipo text not null,
  enviado_em timestamptz not null default now(),
  primary key (usuario_id, data, tipo)
);

alter table lembretes_enviados enable row level security;

-- Quem escreve aqui é o cron, com a chave de serviço, que ignora RLS. A
-- política existe para o dono poder ler o próprio histórico se um dia uma
-- tela precisar mostrar isso.
create policy "lembretes_enviados_self" on lembretes_enviados for select
  using (auth.uid() = usuario_id);
