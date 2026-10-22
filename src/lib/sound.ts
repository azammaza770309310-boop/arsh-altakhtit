"use client";

/**
 * محرك أصوات خفيف عبر Web Audio API — بدون أي ملفات صوتية خارجية.
 * الأصوات: نقرة، إجابة صحيحة، إجابة خاطئة، تكتكة المؤقت، مساعدة، فوز، خسارة.
 */

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("throne-muted", value ? "1" : "0");
  }
}

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("throne-muted") === "1";
}

muted = typeof window !== "undefined" ? localStorage.getItem("throne-muted") === "1" : false;

interface ToneOptions {
  freq: number;
  start?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
}

function tone({ freq, start = 0, duration = 0.15, type = "sine", volume = 0.12, slideTo }: ToneOptions) {
  const audio = getCtx();
  if (!audio || muted) return;
  const t0 = audio.currentTime + start;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sfx = {
  click() {
    tone({ freq: 750, duration: 0.07, type: "triangle", volume: 0.07 });
  },
  correct() {
    tone({ freq: 523.25, start: 0, duration: 0.12, type: "sine", volume: 0.12 });
    tone({ freq: 659.25, start: 0.09, duration: 0.12, type: "sine", volume: 0.12 });
    tone({ freq: 1046.5, start: 0.18, duration: 0.25, type: "sine", volume: 0.14 });
  },
  wrong() {
    tone({ freq: 220, duration: 0.3, type: "sawtooth", volume: 0.09, slideTo: 130 });
    tone({ freq: 160, start: 0.12, duration: 0.35, type: "square", volume: 0.05, slideTo: 90 });
  },
  tick() {
    tone({ freq: 1100, duration: 0.04, type: "square", volume: 0.05 });
  },
  lifeline() {
    tone({ freq: 880, duration: 0.08, type: "triangle", volume: 0.1 });
    tone({ freq: 1174.7, start: 0.07, duration: 0.09, type: "triangle", volume: 0.1 });
    tone({ freq: 1567.98, start: 0.15, duration: 0.14, type: "triangle", volume: 0.1 });
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((f, i) => tone({ freq: f, start: i * 0.13, duration: 0.22, type: "triangle", volume: 0.13 }));
    tone({ freq: 1318.5, start: notes.length * 0.13, duration: 0.6, type: "sine", volume: 0.15 });
  },
  lose() {
    const notes = [392, 349.23, 293.66, 246.94];
    notes.forEach((f, i) => tone({ freq: f, start: i * 0.18, duration: 0.3, type: "triangle", volume: 0.1 }));
  },
  streak(level: number) {
    const base = 660 + level * 40;
    tone({ freq: base, duration: 0.09, type: "sine", volume: 0.09 });
    tone({ freq: base * 1.25, start: 0.08, duration: 0.12, type: "sine", volume: 0.09 });
  },
};
