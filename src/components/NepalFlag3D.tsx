'use client';

import { useEffect, useRef } from 'react';

export default function NepalFlag3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      // -- flag parameters --
      const flagW = Math.min(w * 0.55, 200);
      const flagH = flagW * 1.4;
      const cx = w / 2;
      const cy = h / 2;
      const startX = cx - flagW / 2;
      const startY = cy - flagH / 2;

      // floating offset
      const floatY = Math.sin(time * 1.2) * 8;
      const floatX = Math.cos(time * 0.8) * 3;

      ctx.save();
      ctx.translate(floatX, floatY);

      // subtle 3D rotation via skew
      const skewAmount = Math.sin(time * 0.6) * 0.03;
      ctx.transform(1, skewAmount, 0, 1 - Math.abs(skewAmount) * 0.5, 0, 0);

      // -- Shadow for 3D depth --
      ctx.save();
      ctx.shadowColor = 'rgba(180, 30, 30, 0.35)';
      ctx.shadowBlur = 30 + Math.sin(time) * 10;
      ctx.shadowOffsetX = 8 + Math.sin(time * 0.7) * 4;
      ctx.shadowOffsetY = 12 + Math.cos(time * 0.9) * 4;

      // -- Draw Nepal flag shape (two stacked triangles) --
      // Nepal's flag is the only non-rectangular national flag
      const border = 4;

      // Outer border path
      ctx.beginPath();
      drawFlagPath(ctx, startX, startY, flagW, flagH, border);
      ctx.fillStyle = '#003893'; // blue border
      ctx.fill();

      // Inner red fill
      ctx.beginPath();
      drawFlagPath(ctx, startX + border, startY + border, flagW - border * 2, flagH - border * 2, 0);
      ctx.fillStyle = '#DC143C'; // crimson red
      ctx.fill();
      ctx.restore();

      // -- Moon (upper pennant) --
      const moonCx = startX + flagW * 0.32;
      const moonCy = startY + flagH * 0.2;
      const moonR = flagW * 0.1;

      // crescent moon
      ctx.beginPath();
      ctx.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonCx + moonR * 0.35, moonCy - moonR * 0.15, moonR * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = '#DC143C';
      ctx.fill();

      // moon rays (small arc below)
      const rayCount = 8;
      const arcCx = moonCx;
      const arcCy = moonCy + moonR * 1.4;
      const arcR = moonR * 0.7;
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < rayCount; i++) {
        const angle = Math.PI + (Math.PI / (rayCount - 1)) * i;
        const rx = arcCx + Math.cos(angle) * arcR;
        const ry = arcCy + Math.sin(angle) * arcR * 0.5;
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // -- Sun (lower pennant) --
      const sunCx = startX + flagW * 0.3;
      const sunCy = startY + flagH * 0.55;
      const sunR = flagW * 0.09;

      // sun rays
      ctx.fillStyle = '#FFFFFF';
      const sunRays = 12;
      for (let i = 0; i < sunRays; i++) {
        const angle = (Math.PI * 2 / sunRays) * i + time * 0.3;
        ctx.beginPath();
        ctx.moveTo(
          sunCx + Math.cos(angle) * sunR * 0.5,
          sunCy + Math.sin(angle) * sunR * 0.5
        );
        ctx.lineTo(
          sunCx + Math.cos(angle + 0.15) * sunR * 1.6,
          sunCy + Math.sin(angle + 0.15) * sunR * 1.6
        );
        ctx.lineTo(
          sunCx + Math.cos(angle - 0.15) * sunR * 1.6,
          sunCy + Math.sin(angle - 0.15) * sunR * 1.6
        );
        ctx.closePath();
        ctx.fill();
      }

      // sun center
      ctx.beginPath();
      ctx.arc(sunCx, sunCy, sunR * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // -- Glow pulse around flag --
      const glowAlpha = 0.08 + Math.sin(time * 2) * 0.04;
      const grad = ctx.createRadialGradient(cx, cy, flagW * 0.3, cx, cy, flagW * 1.2);
      grad.addColorStop(0, `rgba(220, 20, 60, ${glowAlpha})`);
      grad.addColorStop(0.5, `rgba(0, 56, 147, ${glowAlpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();

      // -- Floating particles --
      drawParticles(ctx, w, h, time);

      time += 0.016;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="nepal-flag-canvas"
      aria-label="Animated 3D Nepal Flag"
    />
  );
}

/** Draw Nepal's unique double-pennant flag shape */
function drawFlagPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  _inset: number
) {
  const upperH = h * 0.55;
  const lowerH = h * 0.50;
  const indent = w * 0.15; // how far the pennant tips extend

  ctx.moveTo(x, y + upperH);                     // bottom-left of upper triangle
  ctx.lineTo(x, y);                               // top-left
  ctx.lineTo(x + w + indent, y + upperH * 0.5);  // tip of upper pennant
  ctx.lineTo(x + w * 0.15, y + upperH);          // inner notch
  ctx.lineTo(x + w + indent, y + upperH + lowerH * 0.5); // tip of lower pennant
  ctx.lineTo(x, y + upperH + lowerH);            // bottom-left
  ctx.closePath();
}

/** Sparkle particles floating around */
function drawParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  const particles = 18;
  for (let i = 0; i < particles; i++) {
    const seed = i * 137.508; // golden angle
    const px = (w * 0.5) + Math.sin(seed + time * (0.3 + i * 0.05)) * (w * 0.4);
    const py = (h * 0.5) + Math.cos(seed * 0.7 + time * (0.2 + i * 0.03)) * (h * 0.4);
    const size = 1.5 + Math.sin(time * 2 + i) * 1;
    const alpha = 0.3 + Math.sin(time * 1.5 + i * 0.5) * 0.25;

    // alternate colors: red, blue, white
    const colors = [
      `rgba(220, 20, 60, ${alpha})`,
      `rgba(0, 56, 147, ${alpha})`,
      `rgba(255, 255, 255, ${alpha * 0.8})`,
    ];

    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = colors[i % 3];
    ctx.fill();
  }
}
