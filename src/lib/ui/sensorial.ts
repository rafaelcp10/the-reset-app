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

/*
 * O iOS não deixa um site fazer som antes de um gesto — e mente sobre
 * isso: o contexto responde `running` e não sai nada. Então não dá para
 * perguntar ao navegador se o som está saindo; é preciso saber se um
 * gesto já destravou o áudio nesta sessão.
 *
 * O gesto certo é o toque em "Entrar no espelho": ele acontece uma tela
 * antes, e como a navegação é do lado do cliente, o mesmo contexto
 * atravessa e chega vivo na respiração. Assim o som começa sozinho, sem
 * pedir um toque extra para uma tela que existe justamente para a pessoa
 * não tocar em nada.
 */
let contextoCompartilhado: AudioContext | null = null;
let audioDestravado = false;

function novoContexto(): AudioContext | null {
  const Contexto =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return Contexto ? new Contexto() : null;
}

/**
 * Destrava o áudio. Só funciona chamado de dentro de um gesto do usuário
 * (um clique, um toque) — fora disso não faz mal, mas também não destrava.
 */
/**
 * O interruptor lateral do iPhone silencia a Web Audio API.
 *
 * Esta é a explicação que faltava: no iOS, som de página nasce na
 * categoria "ambiente", que é justamente a que o botão de silencioso
 * corta. Com o telefone no silencioso — que é como quase todo mundo anda —
 * o app pode estar tocando certinho e não sair nada, sem erro nenhum para
 * a tela mostrar.
 *
 * `audioSession.type = "playback"` move o áudio para a categoria de mídia,
 * a mesma de um tocador de música, que ignora o interruptor. É o que
 * permite a alguém pôr a respiração para tocar sem antes lembrar de virar
 * uma chave física no lado do aparelho.
 *
 * `"transient"` é o oposto e existe para um caso só: quando a pessoa já
 * pôs música para tocar e quer a voz por cima. O WebKit mapeia esse tipo
 * para uma sessão **misturável**, então o Spotify continua tocando em vez
 * de ser interrompido — ao preço de voltar a obedecer ao interruptor de
 * silencioso. Não existe categoria que faça as duas coisas.
 */
export type ModoDeAudio = "sozinho" | "misturado";

let modoDeAudio: ModoDeAudio = "sozinho";

/** Trocado pela preferência da pessoa, antes de qualquer som começar. */
export function definirModoDeAudio(modo: ModoDeAudio) {
  modoDeAudio = modo;
  prepararSessaoDeAudio();
}

function prepararSessaoDeAudio() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      nav.audioSession.type =
        modoDeAudio === "misturado" ? "transient" : "playback";
    }
  } catch {
    // Navegador sem a API: segue no comportamento padrão.
  }
}

export function destravarAudio() {
  if (lerGuia() === "silencioso") return;
  try {
    prepararSessaoDeAudio();
    contextoCompartilhado ??= novoContexto();
    const contexto = contextoCompartilhado;
    if (!contexto) return;

    contexto.resume().catch(() => {});

    // Um som de um sample, inaudível: o iOS só considera o contexto
    // liberado depois que alguma coisa tocou dentro do gesto.
    const fonte = contexto.createBufferSource();
    fonte.buffer = contexto.createBuffer(1, 1, 22050);
    fonte.connect(contexto.destination);
    fonte.start(0);

    audioDestravado = true;
  } catch {
    // Navegador sem Web Audio: a respiração segue pelos pontos na tela.
  }
}

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
  /** Contexto criado por esta instância — só esse pode ser fechado. */
  private proprio = false;
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
      // Reaproveita o contexto que o toque em "Entrar no espelho" já
      // destravou. Criar um novo aqui seria criar um contexto travado.
      const contexto = contextoCompartilhado ?? novoContexto();
      if (!contexto) return;
      this.proprio = contexto !== contextoCompartilhado;
      contextoCompartilhado ??= contexto;
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
      }

      // "running" não basta: sem um gesto nesta sessão o iOS deixa o
      // contexto rodando e mudo. Sem gesto, espera o primeiro toque em vez
      // de tocar para ninguém.
      if (!audioDestravado || contexto.state === "suspended") {
        return this.retomarNoPrimeiroToque();
      }

      this.ciclar();
    } catch {
      this.parar();
    }
  }

  /**
   * O som está mesmo saindo?
   *
   * Perguntar `contexto.state` não serve: no iOS ele responde "running"
   * com o áudio ainda travado, e a tela concluía que estava tudo bem
   * enquanto a pessoa ouvia silêncio. O que decide é ter havido um gesto.
   */
  tocando(): boolean {
    if (this.modo !== "som") return true;
    return audioDestravado && this.contexto?.state === "running";
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
      destravarAudio();
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
    // O contexto compartilhado sobrevive à tela: fechá-lo aqui obrigaria
    // um gesto novo para destravar o áudio da próxima vez.
    this.ganho?.disconnect();
    this.ganho = null;
    if (this.proprio) this.contexto?.close().catch(() => {});
    this.contexto = null;
  }
}

/** O som está destravado neste aparelho, agora? */
export function audioLiberado(): boolean {
  return audioDestravado && contextoCompartilhado?.state === "running";
}

export type ResultadoAmostra = "tocou" | "sem-audio";

/**
 * Toca uma amostra curta do tom da respiração.
 *
 * Existe porque a falha do som é invisível: sem isto, descobrir que não
 * sai áudio custa entrar no Espelho, respirar e só então perceber. E como
 * a causa costuma ser o interruptor de silencioso — que ninguém associa a
 * um site —, a pessoa conclui que o app está quebrado.
 *
 * Precisa ser chamado de dentro de um toque, como qualquer som no iOS.
 */
export async function tocarAmostra(): Promise<ResultadoAmostra> {
  try {
    prepararSessaoDeAudio();
    contextoCompartilhado ??= novoContexto();
    const contexto = contextoCompartilhado;
    if (!contexto) return "sem-audio";

    await contexto.resume().catch(() => {});
    audioDestravado = true;

    const ganho = contexto.createGain();
    ganho.gain.value = 0;
    ganho.connect(contexto.destination);

    const osciladores = [
      [FUNDAMENTAL_HZ, 1],
      [HARMONICO_HZ, 0.35],
    ].map(([hz, proporcao]) => {
      const osc = contexto.createOscillator();
      const mistura = contexto.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      mistura.gain.value = proporcao;
      osc.connect(mistura).connect(ganho);
      osc.start();
      return osc;
    });

    // Sobe e desce em 1,8s: o bastante para reconhecer o tom, curto o
    // bastante para tocar de novo sem impaciência.
    const agora = contexto.currentTime;
    ganho.gain.linearRampToValueAtTime(PICO_GANHO, agora + 0.7);
    ganho.gain.linearRampToValueAtTime(0, agora + 1.8);

    setTimeout(() => {
      for (const osc of osciladores) {
        try {
          osc.stop();
        } catch {
          // Já parou.
        }
      }
      ganho.disconnect();
    }, 2100);

    return "tocou";
  } catch {
    return "sem-audio";
  }
}
