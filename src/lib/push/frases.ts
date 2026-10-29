/**
 * O texto das notificações, variando.
 *
 * Mesmo aviso com a mesma frase todo dia vira paisagem: a pessoa para de
 * ler antes de terminar. Cada aviso tem algumas versões, e a escolha é uma
 * **rotação**, não sorteio — a rodada sobe de um em um (um dia, um horário
 * de água, uma semana), então a mesma frase nunca vem duas vezes seguidas.
 * Cada pessoa começa num ponto diferente da roda, para não chegar a mesma
 * frase para todo mundo no mesmo minuto.
 *
 * **Todas as frases estão escritas aqui, à mão.** O app escolhe, não
 * escreve. A regra de que o app nunca gera nem sugere frases é sobre as
 * cinco frases do ritual, que são da pessoa; isto aqui é interface, como
 * um rótulo de botão — e mesmo assim nada é gerado na hora.
 *
 * A voz é a do resto do app: sem culpa, sem parabéns, sem placar, sem
 * justificativa científica ("a água melhora o foco" está fora pela regra).
 * No check-in, "não fiz" é resposta tão válida quanto "fiz", e algumas
 * frases dizem isso em voz alta.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

/** Dias desde 1970 de uma data YYYY-MM-DD — a rodada de quem avisa uma vez por dia. */
export function diaCorrido(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA_MS);
}

/** Um número estável por pessoa, para cada uma começar num ponto da roda. */
function deslocamento(usuarioId: string): number {
  let h = 0;
  for (let i = 0; i < usuarioId.length; i++) {
    h = (h * 31 + usuarioId.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * A frase da vez. Rodadas seguidas dão frases seguidas da lista, então
 * nunca se repete de uma vez para a próxima.
 */
export function daVez<T>(frases: readonly T[], usuarioId: string, rodada: number): T {
  const i = (deslocamento(usuarioId) + rodada) % frases.length;
  return frases[(i + frases.length) % frases.length];
}

// ------------------------------------------------------------- check-in

/**
 * A linha é escrita pela pessoa, quase sempre em minúscula ("treinar
 * perna"). Quando ela abre a frase, a primeira letra sobe — e só ela: o
 * resto continua exatamente como a pessoa escreveu.
 */
function abrindo(linha: string): string {
  return linha.charAt(0).toLocaleUpperCase("pt-BR") + linha.slice(1);
}

const CHECKIN_COM_LINHA: readonly ((linha: string) => string)[] = [
  (l) => `Você disse: ${l}`,
  (l) => `Hoje de manhã você escolheu: ${l}`,
  (l) => `${abrindo(l)}. Fez ou não fez? Os dois contam.`,
  (l) => `Fechando o dia: ${l}`,
  (l) => `E aquilo de hoje? ${l}`,
];

const CHECKIN_SEM_LINHA: readonly string[] = [
  "O que você fez hoje?",
  "Fechando o dia. Como foi?",
  "Fez ou não fez? Os dois contam.",
  "Um toque para registrar o dia.",
];

/** A rodada é o dia: um check-in por dia, uma frase nova por dia. */
export function fraseCheckin(usuarioId: string, data: string, linha: string | null): string {
  const rodada = diaCorrido(data);
  return linha
    ? daVez(CHECKIN_COM_LINHA, usuarioId, rodada)(linha)
    : daVez(CHECKIN_SEM_LINHA, usuarioId, rodada);
}

// ----------------------------------------------------------------- água

const AGUA_UMA: readonly string[] = [
  "Falta uma garrafa de água hoje.",
  "Só mais uma garrafa e a água de hoje fecha.",
  "Vamos lá: falta uma garrafa.",
  "Uma garrafa e a água de hoje está feita.",
];

const AGUA_VARIAS: readonly ((n: number) => string)[] = [
  (n) => `Faltam ${n} garrafas de água hoje.`,
  (n) => `Vamos lá: faltam ${n} garrafas.`,
  (n) => `Passando para lembrar: ainda faltam ${n} garrafas.`,
  (n) => `Hora de uma garrafa. Faltam ${n} hoje.`,
  (n) => `${n} garrafas até fechar a água de hoje.`,
];

const HORAS_DE_AGUA = [8, 11, 14, 17, 20];

/**
 * A rodada é o horário: cinco por dia, e o último de um dia emenda no
 * primeiro do seguinte — a frase muda também na virada.
 */
export function fraseAgua(usuarioId: string, data: string, tipo: string, faltam: number): string {
  const hora = Number(tipo.replace("agua_", ""));
  const rodada = diaCorrido(data) * HORAS_DE_AGUA.length + Math.max(0, HORAS_DE_AGUA.indexOf(hora));
  return faltam === 1
    ? daVez(AGUA_UMA, usuarioId, rodada)
    : daVez(AGUA_VARIAS, usuarioId, rodada)(faltam);
}

// ---------------------------------------------------------- fita e foto

const FITA_E_FOTO: readonly string[] = [
  "Fita métrica e uma foto. Cinco minutos.",
  "Hoje é dia de fita e de foto. Cinco minutos.",
  "Fita e foto, as duas hoje. Cinco minutos.",
];

const SO_FOTO: readonly string[] = [
  "Faz um mês desde a última foto.",
  "Um mês desde a última foto. Hora da próxima.",
  "Hoje tem foto: um mês desde a última.",
];

const SO_FITA: readonly string[] = [
  "Domingo de fita métrica. Três minutos.",
  "Fita métrica hoje. Três minutos.",
  "Domingo: hora da fita.",
];

export function fraseEvolucao(
  usuarioId: string,
  data: string,
  medir: boolean,
  fotografar: boolean,
): string {
  const lista = medir && fotografar ? FITA_E_FOTO : fotografar ? SO_FOTO : SO_FITA;
  return daVez(lista, usuarioId, diaCorrido(data));
}

// ------------------------------------------------------- planejamento

const PLANEJAMENTO: readonly string[] = [
  "Domingo: hora de planejar a semana.",
  "Semana nova. Quais são os três inegociáveis?",
  "Cinco minutos para fechar a semana passada e abrir esta.",
  "Antes de a semana engrenar: o planejamento.",
];

/** A rodada é a semana: um domingo, uma frase nova. */
export function frasePlanejamento(usuarioId: string, data: string): string {
  return daVez(PLANEJAMENTO, usuarioId, Math.floor(diaCorrido(data) / 7));
}

// ------------------------------------------------------- treino aberto

const TREINO_ABERTO: readonly ((nome: string, tempo: string) => string)[] = [
  (n, t) => `${n} está aberto há ${t}. Já terminou?`,
  (n, t) => `Treino aberto há ${t}. Se acabou, é só encerrar.`,
  (n, t) => `${t} de ${n}. Encerrar agora deixa o tempo certo.`,
];

/** "1h40", e não "1h 40min" — cabe na frase sem pesar. */
function tempoAberto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} minutos`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** A rodada é o dia: quem esquece todo dia não lê a mesma frase. */
export function fraseTreinoAberto(
  usuarioId: string,
  data: string,
  nomeDoTreino: string,
  minutosAberto: number,
): string {
  return daVez(TREINO_ABERTO, usuarioId, diaCorrido(data))(nomeDoTreino, tempoAberto(minutosAberto));
}
