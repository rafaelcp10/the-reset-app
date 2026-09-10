"use client";

/**
 * Guia sensorial do ritual: o corpo acompanhando a respiração, sem
 * precisar olhar para a tela.
 *
 * A preferência vive no aparelho, não na conta: vibrar depende do
 * hardware (o iPhone não expõe isso ao navegador) e som depende de onde a
 * pessoa está. O mesmo usuário quer coisas diferentes no celular e no
 * tablet.
 */

const CHAVE = "the-reset:guia-sensorial";

export type GuiaSensorial = "silencioso" | "vibracao" | "som";

export function lerGuia(): GuiaSensorial {
  if (typeof window === "undefined") return "silencioso";
  try {
    const valor = window.localStorage.getItem(CHAVE);
    if (valor === "vibracao" || valor === "som") return valor;
  } catch {
    // Navegador com armazenamento bloqueado: segue no silêncio.
  }
  return "silencioso";
}

export function gravarGuia(valor: GuiaSensorial) {
  try {
    window.localStorage.setItem(CHAVE, valor);
  } catch {
    // Sem persistir, vale só para esta sessão.
  }
}

export function vibracaoDisponivel(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Toque curto de confirmação. Silencioso quando o aparelho não vibra. */
export function vibrarMarcacao() {
  if (lerGuia() !== "vibracao") return;
  try {
    navigator.vibrate?.(12);
  } catch {
    // Nada a fazer: vibrar é sempre acessório.
  }
}

export const CICLO_RESPIRACAO_MS = 6000;

/**
 * A frequência é a diferença entre ouvir e não ouvir nada. O tom antigo
 * era de 96 Hz — bonito no fone, inexistente no alto-falante do celular,
 * que praticamente não reproduz nada abaixo de uns 300 Hz. 220 Hz com um
 * segundo tom uma oitava acima atravessa o alto-falante e continua sendo
 * um zumbido calmo, não uma nota.
 */
const FUNDAMENTAL_HZ = 220;
const HARMONICO_HZ = 440;
/** Guia, não trilha — mas alto o bastante para existir num celular. */
const PICO_GANHO = 0.16;

/**
 * Ciclo de respiração de 6s — o mesmo dos pontos na tela. Sobe em 2,5s,
 * segura, e desce. Em som é um tom que incha e some; em vibração é um
 * pulso curto marcando o começo de cada ciclo.
 */
export class GuiaRespiracao {
  private contexto: AudioContext | null = null;
  private osciladores: OscillatorNode[] = [];
  private ganho: GainNode | null = null;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private destravar: (() => void) | null = null;
  /** parar() pode chegar no meio de um await; daí em diante não recomeça. */
  private morto = false;
  private readonly modo: GuiaSensorial;

  constructor(modo: GuiaSensorial) {
    this.modo = modo;
  }

  async iniciar() {
    if (this.modo === "silencioso" || this.morto) return;

    if (this.modo === "vibracao") {
      this.pulsar();
      this.intervalo = setInterval(() => this.pulsar(), CICLO_RESPIRACAO_MS);
      return;
    }

    try {
      const Contexto =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const contexto = new Contexto();
      this.contexto = contexto;

      const ganho = contexto.createGain();
      ganho.gain.value = 0;
      ganho.connect(contexto.destination);
      this.ganho = ganho;

      for (const [hz, proporcao] of [
        [FUNDAMENTAL_HZ, 1],
        [HARMONICO_HZ, 0.35],
      ] as const) {
        const oscilador = contexto.createOscillator();
        const mistura = contexto.createGain();
        oscilador.type = "sine";
        oscilador.frequency.value = hz;
        mistura.gain.value = proporcao;
        oscilador.connect(mistura).connect(ganho);
        oscilador.start();
        this.osciladores.push(oscilador);
      }

      if (contexto.state === "suspended") {
        await contexto.resume().catch(() => {});
        if (this.morto) return this.parar();
        // No iOS o áudio só começa depois de um gesto, e chegar aqui foi
        // uma navegação. Então esperamos o primeiro toque da pessoa em vez
        // de desistir do som.
        if (contexto.state === "suspended") return this.retomarNoPrimeiroToque();
      }

      this.ciclar();
    } catch {
      this.parar();
    }
  }

  /** O som já está saindo? No iOS costuma ser falso até um toque. */
  tocando(): boolean {
    if (this.modo !== "som") return true;
    return this.contexto?.state === "running";
  }

  private ciclar() {
    if (this.intervalo) clearInterval(this.intervalo);
    this.respirar();
    this.intervalo = setInterval(() => this.respirar(), CICLO_RESPIRACAO_MS);
  }

  private retomarNoPrimeiroToque() {
    const retomar = () => {
      document.removeEventListener("pointerdown", retomar);
      this.destravar = null;
      // O ciclo começa depois do resume, não antes: uma envoltória agendada
      // com o contexto suspenso era consumida no vazio e a pessoa destravava
      // o som bem a tempo de ouvir o silêncio.
      this.contexto
        ?.resume()
        .then(() => {
          if (!this.morto) this.ciclar();
        })
        .catch(() => {});
    };
    this.destravar = retomar;
    document.addEventListener("pointerdown", retomar);
  }

  private pulsar() {
    try {
      navigator.vibrate?.([40, 60, 40]);
    } catch {
      // Aparelho sem vibração: o ciclo segue só nos pontos da tela.
    }
  }

  private respirar() {
    const contexto = this.contexto;
    const ganho = this.ganho;
    if (!contexto || !ganho) return;

    const agora = contexto.currentTime;
    ganho.gain.cancelScheduledValues(agora);
    ganho.gain.setValueAtTime(ganho.gain.value, agora);
    ganho.gain.linearRampToValueAtTime(PICO_GANHO, agora + 2.5);
    ganho.gain.linearRampToValueAtTime(PICO_GANHO * 0.9, agora + 3);
    ganho.gain.linearRampToValueAtTime(0, agora + 5.6);
  }

  parar() {
    this.morto = true;
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = null;
    if (this.destravar) {
      document.removeEventListener("pointerdown", this.destravar);
      this.destravar = null;
    }
    for (const oscilador of this.osciladores) {
      try {
        oscilador.stop();
      } catch {
        // Já parado.
      }
    }
    this.osciladores = [];
    this.ganho = null;
    this.contexto?.close().catch(() => {});
    this.contexto = null;
  }
}
