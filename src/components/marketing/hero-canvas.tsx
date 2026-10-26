"use client";

import { useEffect, useRef } from "react";

const GOLD = [233, 207, 152] as const;
const VIOLET = [166, 140, 255] as const;

// Flowing light ribbons plus a drifting gold constellation behind the hero. Canvas 2D only; it pauses when the hero is
// off-screen or the tab is hidden, and draws a single still frame for reduced-motion visitors.
export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, visible = true, t = 0;
    type Dot = { x: number; y: number; vx: number; vy: number; r: number; tw: number };
    let dots: Dot[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: 0.6 + Math.random() * 1.6, tw: Math.random() * Math.PI * 2,
      }));
    };

    const rgba = (c: readonly number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    const ribbon = (color: readonly number[], amp: number, freq: number, speed: number, yBase: number, phase: number, alpha: number) => {
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 16) {
        const y = yBase * h + Math.sin(x * freq + t * speed + phase) * amp + Math.sin(x * freq * 0.5 - t * speed * 0.7 + phase) * amp * 0.6;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // A wide faint stroke under a thin bright one reads as a glow without the cost of shadowBlur.
      ctx.strokeStyle = rgba(color, alpha * 0.35);
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = rgba(color, alpha * 2.2);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Light ribbons sweeping across the screen.
      for (let i = 0; i < 5; i++) {
        ribbon(i % 2 ? VIOLET : GOLD, 40 + i * 14, 0.0028 + i * 0.0006, 0.6 + i * 0.12, 0.35 + i * 0.09, i * 1.7, 0.16 - i * 0.018);
      }

      // Constellation: drifting dots joined by faint lines when close.
      for (const d of dots) {
        if (!reduce) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -10) d.x = w + 10; else if (d.x > w + 10) d.x = -10;
          if (d.y < -10) d.y = h + 10; else if (d.y > h + 10) d.y = -10;
        }
        const a = 0.45 + Math.sin(t * 2 + d.tw) * 0.35;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(GOLD, a);
        ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]!, b = dots[j]!;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = rgba(GOLD, (1 - dist / 130) * 0.18);
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = () => {
      t += 0.008;
      frame();
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { if (!raf && !reduce && visible && !document.hidden) raf = requestAnimationFrame(loop); };

    resize();
    frame();
    start();
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; start(); });
    io.observe(canvas);
    const ro = new ResizeObserver(() => { resize(); frame(); });
    ro.observe(canvas);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />;
}
