/**
 * Catálogo de exercícios — só para autocompletar.
 *
 * O app continua não montando treino nenhum: isto existe para a pessoa não
 * ter que digitar "desenvolvimento militar com halteres" por extenso toda
 * vez. Ela pode escrever qualquer nome fora da lista, e nada aqui sugere o
 * que treinar.
 *
 * A lista nasceu do free-exercise-db (domínio público), mas foi reescrita
 * no vocabulário de academia brasileira: ninguém aqui pede "Barbell
 * Guillotine Bench Press", pede supino. Fica embarcada no app em vez de vir
 * de uma API — assim o autocompletar funciona sem rede, como o resto.
 *
 * `degrau` é só o palpite inicial do passo de carga, editável por exercício:
 * barra sobe de 2,5 kg (uma anilha de 1,25 de cada lado), halter de 2, e
 * máquina costuma ter pino de 5. Peso do corpo vem 0 — ali quem sobe é a
 * repetição, não a carga.
 */

export type GrupoMuscular =
  | "peito"
  | "costas"
  | "pernas"
  | "gluteos"
  | "ombros"
  | "bracos"
  | "core"
  | "panturrilha";

export const ROTULO_GRUPO: Record<GrupoMuscular, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  gluteos: "Glúteos",
  ombros: "Ombros",
  bracos: "Braços",
  core: "Core",
  panturrilha: "Panturrilha",
};

export const GRUPOS: GrupoMuscular[] = [
  "peito",
  "costas",
  "pernas",
  "gluteos",
  "ombros",
  "bracos",
  "core",
  "panturrilha",
];

export type ExercicioCatalogo = {
  nome: string;
  grupo: GrupoMuscular;
  degrau: number;
};

const B = 2.5; // barra
const H = 2; // halter
const M = 5; // máquina ou polia com pino
const C = 0; // peso do corpo

export const CATALOGO: ExercicioCatalogo[] = [
  { nome: "Supino reto com barra", grupo: "peito", degrau: B },
  { nome: "Supino reto com halteres", grupo: "peito", degrau: H },
  { nome: "Supino inclinado com barra", grupo: "peito", degrau: B },
  { nome: "Supino inclinado com halteres", grupo: "peito", degrau: H },
  { nome: "Supino declinado", grupo: "peito", degrau: B },
  { nome: "Supino na máquina", grupo: "peito", degrau: M },
  { nome: "Crucifixo com halteres", grupo: "peito", degrau: H },
  { nome: "Crucifixo inclinado", grupo: "peito", degrau: H },
  { nome: "Crossover na polia", grupo: "peito", degrau: M },
  { nome: "Voador (peck deck)", grupo: "peito", degrau: M },
  { nome: "Flexão de braço", grupo: "peito", degrau: C },
  { nome: "Mergulho em paralelas", grupo: "peito", degrau: C },
  { nome: "Pullover com halter", grupo: "peito", degrau: H },

  { nome: "Barra fixa (pegada pronada)", grupo: "costas", degrau: C },
  { nome: "Barra fixa (pegada supinada)", grupo: "costas", degrau: C },
  { nome: "Puxada frontal na polia", grupo: "costas", degrau: M },
  { nome: "Puxada com pegada neutra", grupo: "costas", degrau: M },
  { nome: "Puxada supinada", grupo: "costas", degrau: M },
  { nome: "Remada curvada com barra", grupo: "costas", degrau: B },
  { nome: "Remada curvada com halteres", grupo: "costas", degrau: H },
  { nome: "Remada unilateral (serrote)", grupo: "costas", degrau: H },
  { nome: "Remada baixa na polia", grupo: "costas", degrau: M },
  { nome: "Remada cavalinho", grupo: "costas", degrau: B },
  { nome: "Remada na máquina", grupo: "costas", degrau: M },
  { nome: "Pulldown com braço estendido", grupo: "costas", degrau: M },
  { nome: "Levantamento terra", grupo: "costas", degrau: B },
  { nome: "Terra romeno", grupo: "costas", degrau: B },
  { nome: "Hiperextensão lombar", grupo: "costas", degrau: C },
  { nome: "Encolhimento com halteres", grupo: "costas", degrau: H },
  { nome: "Encolhimento com barra", grupo: "costas", degrau: B },

  { nome: "Agachamento livre", grupo: "pernas", degrau: B },
  { nome: "Agachamento frontal", grupo: "pernas", degrau: B },
  { nome: "Agachamento no smith", grupo: "pernas", degrau: B },
  { nome: "Agachamento búlgaro", grupo: "pernas", degrau: H },
  { nome: "Agachamento hack", grupo: "pernas", degrau: M },
  { nome: "Leg press 45°", grupo: "pernas", degrau: M },
  { nome: "Leg press horizontal", grupo: "pernas", degrau: M },
  { nome: "Cadeira extensora", grupo: "pernas", degrau: M },
  { nome: "Mesa flexora", grupo: "pernas", degrau: M },
  { nome: "Cadeira flexora", grupo: "pernas", degrau: M },
  { nome: "Stiff com barra", grupo: "pernas", degrau: B },
  { nome: "Stiff com halteres", grupo: "pernas", degrau: H },
  { nome: "Afundo com halteres", grupo: "pernas", degrau: H },
  { nome: "Passada (walking lunge)", grupo: "pernas", degrau: H },
  { nome: "Avanço no smith", grupo: "pernas", degrau: B },
  { nome: "Cadeira adutora", grupo: "pernas", degrau: M },
  { nome: "Cadeira abdutora", grupo: "pernas", degrau: M },
  { nome: "Levantamento terra sumô", grupo: "pernas", degrau: B },

  { nome: "Elevação pélvica com barra", grupo: "gluteos", degrau: B },
  { nome: "Elevação pélvica na máquina", grupo: "gluteos", degrau: M },
  { nome: "Glúteo na polia (coice)", grupo: "gluteos", degrau: M },
  { nome: "Glúteo na máquina", grupo: "gluteos", degrau: M },
  { nome: "Ponte de glúteo", grupo: "gluteos", degrau: C },
  { nome: "Abdução de quadril na polia", grupo: "gluteos", degrau: M },

  { nome: "Desenvolvimento com barra", grupo: "ombros", degrau: B },
  { nome: "Desenvolvimento com halteres", grupo: "ombros", degrau: H },
  { nome: "Desenvolvimento Arnold", grupo: "ombros", degrau: H },
  { nome: "Desenvolvimento na máquina", grupo: "ombros", degrau: M },
  { nome: "Elevação lateral", grupo: "ombros", degrau: H },
  { nome: "Elevação lateral na polia", grupo: "ombros", degrau: M },
  { nome: "Elevação frontal", grupo: "ombros", degrau: H },
  { nome: "Crucifixo inverso", grupo: "ombros", degrau: H },
  { nome: "Crucifixo inverso na máquina", grupo: "ombros", degrau: M },
  { nome: "Remada alta", grupo: "ombros", degrau: B },
  { nome: "Face pull", grupo: "ombros", degrau: M },

  { nome: "Rosca direta com barra", grupo: "bracos", degrau: B },
  { nome: "Rosca direta com halteres", grupo: "bracos", degrau: H },
  { nome: "Rosca alternada", grupo: "bracos", degrau: H },
  { nome: "Rosca martelo", grupo: "bracos", degrau: H },
  { nome: "Rosca scott", grupo: "bracos", degrau: B },
  { nome: "Rosca concentrada", grupo: "bracos", degrau: H },
  { nome: "Rosca na polia", grupo: "bracos", degrau: M },
  { nome: "Rosca inversa", grupo: "bracos", degrau: B },
  { nome: "Tríceps na polia (corda)", grupo: "bracos", degrau: M },
  { nome: "Tríceps na polia (barra)", grupo: "bracos", degrau: M },
  { nome: "Tríceps testa", grupo: "bracos", degrau: B },
  { nome: "Tríceps francês", grupo: "bracos", degrau: H },
  { nome: "Tríceps coice", grupo: "bracos", degrau: H },
  { nome: "Supino fechado", grupo: "bracos", degrau: B },
  { nome: "Mergulho no banco", grupo: "bracos", degrau: C },
  { nome: "Rosca punho", grupo: "bracos", degrau: H },

  { nome: "Abdominal supra", grupo: "core", degrau: C },
  { nome: "Abdominal infra", grupo: "core", degrau: C },
  { nome: "Abdominal na polia", grupo: "core", degrau: M },
  { nome: "Abdominal na máquina", grupo: "core", degrau: M },
  { nome: "Prancha", grupo: "core", degrau: C },
  { nome: "Prancha lateral", grupo: "core", degrau: C },
  { nome: "Elevação de pernas suspenso", grupo: "core", degrau: C },
  { nome: "Rotação russa", grupo: "core", degrau: H },
  { nome: "Ab wheel", grupo: "core", degrau: C },

  { nome: "Panturrilha em pé", grupo: "panturrilha", degrau: M },
  { nome: "Panturrilha sentado", grupo: "panturrilha", degrau: M },
  { nome: "Panturrilha no leg press", grupo: "panturrilha", degrau: M },
  { nome: "Panturrilha no smith", grupo: "panturrilha", degrau: B },
];

/** Tira acento e caixa para a busca casar com o que a pessoa digita. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Sugestões para o que já foi digitado. Devolve vazio com menos de dois
 * caracteres — antes disso a lista inteira apareceria sozinha na tela, e aí
 * ela viraria recomendação, que é justamente o que este catálogo não é.
 */
export function sugerir(termo: string, limite = 6): ExercicioCatalogo[] {
  const busca = normalizar(termo);
  if (busca.length < 2) return [];

  const comeca: ExercicioCatalogo[] = [];
  const contem: ExercicioCatalogo[] = [];

  for (const item of CATALOGO) {
    const nome = normalizar(item.nome);
    if (nome.startsWith(busca)) comeca.push(item);
    else if (nome.includes(busca)) contem.push(item);
  }

  return [...comeca, ...contem].slice(0, limite);
}
