export type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
};

// A lightweight fallback implementation to mimic canvas-confetti behavior.
export default function confetti(options: ConfettiOptions = {}) {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.pointerEvents = "none";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const count = options.particleCount ?? 80;
  const spread = (options.spread ?? 60) * (Math.PI / 180);
  const originY = (options.origin?.y ?? 0.7) * canvas.height;
  const originX = (options.origin?.x ?? 0.5) * canvas.width;
  const colors = options.colors ?? ["#a855f7", "#22c55e", "#f472b6", "#38bdf8", "#f59e0b"];

  const particles = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = 6 + Math.random() * 6;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 60 + Math.random() * 20,
    };
  });

  let frame = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life -= 1;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    if (frame < 90) requestAnimationFrame(tick);
    else canvas.remove();
  };

  requestAnimationFrame(tick);
}
