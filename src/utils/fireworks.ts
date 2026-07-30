/**
 * High-performance 5-Second Continuous Canvas Fireworks & Confetti Celebration
 */
export function triggerFireworks(durationMs: number = 5000) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
    decay: number;
    rotation: number;
    rotSpeed: number;
    shape: 'circle' | 'rect';
  }> = [];

  const colors = [
    '#f59e0b', '#fbbf24', '#4ade80', '#38bdf8', '#a855f7',
    '#ec4899', '#ffffff', '#ffd700', '#34d399', '#60a5fa'
  ];

  const spawnBurst = (originX?: number, originY?: number, count: number = 50) => {
    const x = originX ?? (Math.random() * 0.8 + 0.1) * canvas.width;
    const y = originY ?? (Math.random() * 0.4 + 0.15) * canvas.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 13 + 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        alpha: 1,
        decay: Math.random() * 0.009 + 0.005,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.4 ? 'circle' : 'rect',
      });
    }
  };

  // Initial grand center explosion
  spawnBurst(canvas.width / 2, canvas.height / 3, 140);

  // Continuously spawn fireworks bursts over 5 seconds
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed < durationMs - 600) {
      spawnBurst(undefined, undefined, 45);
    } else {
      clearInterval(interval);
    }
  }, 350);

  let animationFrameId: number;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach((p) => {
      if (p.alpha > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // Gravity drift
        p.vx *= 0.985; // Air drag
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }
    });

    if (elapsed < durationMs + 1800) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      clearInterval(interval);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  render();
}
