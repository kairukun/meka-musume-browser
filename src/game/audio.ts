/** Lightweight Web Audio bed + SFX — no asset files required. */

let ctx: AudioContext | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setAudioMuted(on: boolean) {
  muted = on;
  if (on) stopAmbient();
}

export function isAudioMuted() {
  return muted;
}

function beep(freq: number, dur: number, type: OscillatorType, vol = 0.04, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfxClick() {
  beep(520, 0.06, "triangle", 0.03);
}

export function sfxConfirm() {
  beep(440, 0.08, "sine", 0.035);
  beep(660, 0.1, "sine", 0.03, 0.06);
}

export function sfxHit() {
  beep(180, 0.12, "square", 0.045);
  beep(90, 0.18, "sawtooth", 0.025, 0.02);
}

export function sfxWin() {
  beep(523, 0.12, "sine", 0.04);
  beep(659, 0.12, "sine", 0.04, 0.1);
  beep(784, 0.18, "sine", 0.045, 0.2);
}

export function sfxLose() {
  beep(220, 0.2, "triangle", 0.04);
  beep(165, 0.28, "triangle", 0.035, 0.12);
}

export function startAmbient() {
  if (muted || ambientNodes) return;
  const c = ac();
  if (!c) return;
  const mk = (freq: number, vol: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    return { osc, gain };
  };
  ambientNodes = [mk(110, 0.012), mk(164.5, 0.008), mk(220, 0.006)];
}

export function stopAmbient() {
  if (!ambientNodes) return;
  for (const n of ambientNodes) {
    try {
      n.osc.stop();
      n.osc.disconnect();
      n.gain.disconnect();
    } catch {
      /* ignore */
    }
  }
  ambientNodes = null;
}

export function ensureAudio() {
  ac();
  startAmbient();
}
