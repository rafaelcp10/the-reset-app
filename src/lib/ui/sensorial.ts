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

/**
 * Ciclo de respiração de 6s — o mesmo dos pontos na tela. Sobe em 2,5s,
 * segura, e desce. Em som é um tom grave que incha e some; em vibração é
 * um pulso curto marcando o começo de cada ciclo.
 */
export class GuiaRespiracao {
  private contexto: AudioContext | null = null;
  private oscilador: OscillatorNode | null = null;
  private ganho: GainNode | null = null;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private destravar: (() => void) | null = null;
  private readonly modo: GuiaSensorial;

  constructor(modo: GuiaSensorial) {
    this.modo = modo;
  }

  async iniciar() {
    if (this.modo === "silencioso") return;

    if (this.modo === "vibracao") {
      this.pulsar();
      this.intervalo = setInterval(() => this.pulsar(), 6000);
      return;
    }

    try {
      const Contexto =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.contexto = new Contexto();
      if (this.contexto.state === "suspended") {
        await this.contexto.resume().catch(() => {});
        // No iOS o áudio só começa depois de um gesto, e chegar aqui foi
        // uma navegação. Então esperamos o primeiro toque da pessoa em vez
        // de desistir do som.
        if (this.contexto.state === "suspended") this.retomarNoPrimeiroToque();
      }

      this.oscilador = this.contexto.createOscillator();
      this.ganho = this.contexto.createGain();
      // Grave o bastante para não competir com a música nem com a voz.
      this.oscilador.frequency.value = 96;
      this.oscilador.type = "sine";
      this.ganho.gain.value = 0;
      this.oscilador.connect(this.ganho).connect(this.contexto.destination);
      this.oscilador.start();

      this.respirar();
      this.intervalo = setInterval(() => this.respirar(), 6000);
    } catch {
      this.parar();
    }
  }

  /** O som já está saindo? No iOS costuma ser falso até um toque. */
  tocando(): boolean {
    if (this.modo !== "som") return true;
    return this.contexto?.state === "running";
  }

  private retomarNoPrimeiroToque() {
    const retomar = () => {
      this.contexto?.resume().catch(() => {});
      document.removeEventListener("pointerdown", retomar);
    };
    this.destravar = retomar;
    document.addEventListener("pointerdown", retomar, { once: true });
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
    const pico = 0.06; // baixo de propósito: guia, não trilha
    ganho.gain.cancelScheduledValues(agora);
    ganho.gain.setValueAtTime(ganho.gain.value, agora);
    ganho.gain.linearRampToValueAtTime(pico, agora + 2.5);
    ganho.gain.linearRampToValueAtTime(pico * 0.9, agora + 3);
    ganho.gain.linearRampToValueAtTime(0, agora + 5.6);
  }

  parar() {
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = null;
    if (this.destravar) {
      document.removeEventListener("pointerdown", this.destravar);
      this.destravar = null;
    }
    try {
      this.oscilador?.stop();
    } catch {
      // Já parado.
    }
    this.oscilador = null;
    this.ganho = null;
    this.contexto?.close().catch(() => {});
    this.contexto = null;
  }
}
