"use client";

/**
 * محرك كونفيتي خفيف على canvas — بدون مكتبات خارجية.
 * burst(): انفجار صغير عند الإجابة الصحيحة.
 * celebrate(): احتفال ملكي متعدد الانفجارات عند الفوز.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  life: number;
  shape: "rect" | "circle";
}

const ROYAL_COLORS = ["#E8C766", "#C9A227", "#F5E7C1", "#B8860B", "#8E44AD", "#FFFFFF", "#D4AF37"];

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId = 0;

function ensureCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (canvas && canvas.isConnected) return canvas;
  canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  context = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  return canvas;
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
}

function loop() {
  if (!context || !canvas) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0 && p.y < canvas!.height + 60);
  for (const p of particles) {
    p.life -= 1;
    p.vy += 0.12; // جاذبية خفيفة
    p.vx *= 0.995;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vr;
    context.save();
    context.translate(p.x * devicePixelRatio, p.y * devicePixelRatio);
    context.rotate(p.rotation);
    context.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
    context.fillStyle = p.color;
    if (p.shape === "rect") {
      context.fillRect((-p.size / 2) * devicePixelRatio, (-p.size / 4) * devicePixelRatio, p.size * devicePixelRatio, (p.size / 2) * devicePixelRatio);
    } else {
      context.beginPath();
      context.arc(0, 0, (p.size / 2) * devicePixelRatio, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  if (particles.length > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(rafId);
    rafId = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.remove();
    window.removeEventListener("resize", resize);
  }
}

export function burst(x?: number, y?: number, count = 60) {
  const c = ensureCanvas();
  if (!c) return;
  const cx = (x ?? window.innerWidth / 2) * devicePixelRatio;
  const cy = (y ?? window.innerHeight * 0.4) * devicePixelRatio;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (3 + Math.random() * 7) * devicePixelRatio;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3 * devicePixelRatio,
      size: 5 + Math.random() * 7,
      color: ROYAL_COLORS[Math.floor(Math.random() * ROYAL_COLORS.length)],
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 60 + Math.random() * 40,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    });
  }
  if (!rafId) rafId = requestAnimationFrame(loop);
}

/** احتفال ملكي: سلسلة انفجارات ذهبية متتابعة */
export function celebrate() {
  const w = typeof window === "undefined" ? 1200 : window.innerWidth;
  const h = typeof window === "undefined" ? 800 : window.innerHeight;
  const spots: Array<[number, number]> = [
    [w * 0.5, h * 0.35],
    [w * 0.15, h * 0.5],
    [w * 0.85, h * 0.5],
    [w * 0.3, h * 0.25],
    [w * 0.7, h * 0.25],
    [w * 0.5, h * 0.6],
  ];
  spots.forEach(([x, y], i) => {
    setTimeout(() => burst(x, y, 45), i * 220);
  });
}
