/**
 * Audio — file-based BGM + SFX (CC0 / free game assets).
 * See public/assets/audio/CREDITS.txt for sources.
 */

const BASE = import.meta.env.BASE_URL;

const MUSIC = {
  hub: `${BASE}assets/audio/music/hub.ogg`,
  hangar: `${BASE}assets/audio/music/hangar-hum.ogg`,
  battle: `${BASE}assets/audio/music/battle.ogg`,
} as const;

const SFX = {
  click: `${BASE}assets/audio/sfx/click.wav`,
  confirm: `${BASE}assets/audio/sfx/confirm.wav`,
  drop: `${BASE}assets/audio/sfx/drop.wav`,
  hit: `${BASE}assets/audio/sfx/hit.ogg`,
  win: `${BASE}assets/audio/sfx/win.wav`,
  lose: `${BASE}assets/audio/sfx/lose.wav`,
} as const;

export type MusicTrack = keyof typeof MUSIC | "none";

let muted = false;
let unlocked = false;
let currentTrack: MusicTrack = "none";
let musicEl: HTMLAudioElement | null = null;
let humEl: HTMLAudioElement | null = null;
const sfxCache = new Map<string, HTMLAudioElement>();

function makeAudio(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const a = new Audio(src);
  a.loop = loop;
  a.preload = "auto";
  a.volume = volume;
  return a;
}

function ensureEls() {
  if (!musicEl) musicEl = makeAudio(MUSIC.hub, true, 0.26);
  if (!humEl) humEl = makeAudio(MUSIC.hangar, true, 0.1);
}

async function tryPlay(el: HTMLAudioElement | null) {
  if (!el || muted || !unlocked) return;
  try {
    await el.play();
  } catch {
    /* autoplay blocked until gesture */
  }
}

export function setAudioMuted(on: boolean) {
  muted = on;
  if (on) {
    musicEl?.pause();
    humEl?.pause();
  } else if (unlocked && currentTrack !== "none") {
    void tryPlay(musicEl);
    if (currentTrack === "hub") void tryPlay(humEl);
  }
}

export function isAudioMuted() {
  return muted;
}

/** Call from a user gesture so browsers allow playback. */
export function unlockAudio() {
  unlocked = true;
  ensureEls();
  if (!muted && currentTrack !== "none") {
    void tryPlay(musicEl);
    if (currentTrack === "hub") void tryPlay(humEl);
  }
}

export function setMusicTrack(track: MusicTrack) {
  ensureEls();
  if (!musicEl) return;

  if (track === "none") {
    currentTrack = "none";
    musicEl.pause();
    humEl?.pause();
    return;
  }

  const nextSrc = track === "battle" ? MUSIC.battle : MUSIC.hub;
  const nextFile = track === "battle" ? "battle.ogg" : "hub.ogg";
  const switched = !musicEl.src.includes(nextFile);

  currentTrack = track;
  if (switched) {
    const t = musicEl.currentTime;
    musicEl.src = nextSrc;
    musicEl.loop = true;
    musicEl.load();
    // don't restore time across different tracks
    void t;
  }
  musicEl.volume = track === "battle" ? 0.3 : 0.24;

  if (track === "hub") {
    if (humEl) {
      humEl.volume = 0.09;
      void tryPlay(humEl);
    }
  } else {
    humEl?.pause();
  }

  void tryPlay(musicEl);
}

function playSfx(src: string, volume = 0.45) {
  if (muted || !unlocked) return;
  let base = sfxCache.get(src);
  if (!base) {
    base = makeAudio(src, false, volume);
    sfxCache.set(src, base);
  }
  const node = base.cloneNode(true) as HTMLAudioElement;
  node.volume = volume;
  void node.play().catch(() => undefined);
}

export function sfxClick() {
  playSfx(SFX.click, 0.38);
}
export function sfxConfirm() {
  playSfx(SFX.confirm, 0.4);
}
export function sfxDrop() {
  playSfx(SFX.drop, 0.32);
}
export function sfxHit() {
  playSfx(SFX.hit, 0.36);
}
export function sfxWin() {
  playSfx(SFX.win, 0.42);
}
export function sfxLose() {
  playSfx(SFX.lose, 0.38);
}

export function startAmbient() {
  setMusicTrack(currentTrack === "none" || currentTrack === "hangar" ? "hub" : currentTrack);
}

export function stopAmbient() {
  musicEl?.pause();
  humEl?.pause();
}

export function ensureAudio() {
  unlockAudio();
  if (currentTrack === "none") setMusicTrack("hub");
  else setMusicTrack(currentTrack);
}
