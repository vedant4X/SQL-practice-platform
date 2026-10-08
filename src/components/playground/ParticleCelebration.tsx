"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useTheme } from "@/lib/theme/ThemeContext";

export interface ParticleCelebrationHandle {
  burst: (originX?: number, originY?: number) => void;
}

type ParticleType = "bracket-left" | "bracket-right" | "semicolon" | "cylinder" | "star" | "bolt" | "shard";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  alpha: number;
  decay: number;
  color: string;
  type: ParticleType;
  size: number;
}

const ParticleCelebration = forwardRef<ParticleCelebrationHandle, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const { theme } = useTheme();

  // Resize canvas to window size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getPalette = () => {
    if (theme === "dark") {
      return ["#39ff14", "#fcee0a", "#ff007f", "#00f0ff", "#ffffff"];
    }
    return ["#0022ff", "#ff4d00", "#7928ca", "#ffb800", "#000000"];
  };

  const drawCylinder = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    const w = size * 1.2;
    const h = size * 1.6;
    const ry = size * 0.35;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Body
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2 + ry, w, h - ry * 2);
    ctx.fill();

    // Top cap
    ctx.beginPath();
    ctx.ellipse(0, -h / 2 + ry, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.stroke();

    // Bottom cap
    ctx.beginPath();
    ctx.ellipse(0, h / 2 - ry, w / 2, ry, 0, 0, Math.PI);
    ctx.stroke();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x1 = Math.cos(angle) * size * 1.5;
      const y1 = Math.sin(angle) * size * 1.5;
      const x2 = Math.cos(angle + Math.PI / 4) * (size * 0.4);
      const y2 = Math.sin(angle + Math.PI / 4) * (size * 0.4);
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawBolt = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size);
    ctx.lineTo(size * 0.5, -size * 0.1);
    ctx.lineTo(0, 0);
    ctx.lineTo(size * 0.4, size);
    ctx.lineTo(-size * 0.5, size * 0.1);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Physics update
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.26; // Gravity
      p.vx *= 0.965; // Air resistance
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);

      // Render vector particle based on type
      if (p.type === "bracket-left" || p.type === "bracket-right") {
        ctx.fillStyle = p.color;
        ctx.font = `900 ${p.size * 1.8}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.type === "bracket-left" ? "{" : "}", 0, 0);
      } else if (p.type === "semicolon") {
        ctx.fillStyle = p.color;
        ctx.font = `900 ${p.size * 2.2}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(";", 0, 0);
      } else if (p.type === "cylinder") {
        drawCylinder(ctx, p.size, p.color);
      } else if (p.type === "star") {
        drawStar(ctx, p.size, p.color);
      } else if (p.type === "bolt") {
        drawBolt(ctx, p.size, p.color);
      } else {
        // Geometric neon shard
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    } else {
      animFrameRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    burst: (originX?: number, originY?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ox = originX ?? canvas.width / 2;
      const oy = originY ?? canvas.height / 3;

      const palette = getPalette();
      const types: ParticleType[] = [
        "bracket-left",
        "bracket-right",
        "semicolon",
        "cylinder",
        "star",
        "bolt",
        "shard",
        "shard",
      ];

      const count = 95; // Exaggerated arcade explosion volume
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        // Radial 360 burst with variable velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 16 + 5;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const type = types[Math.floor(Math.random() * types.length)];

        newParticles.push({
          x: ox,
          y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4, // Upward initial impulse
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          scale: Math.random() * 0.6 + 0.7,
          alpha: 1,
          decay: Math.random() * 0.012 + 0.012, // Lasts ~1.5 - 2.5s
          color,
          type,
          size: Math.random() * 8 + 10,
        });
      }

      particlesRef.current.push(...newParticles);

      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
});

ParticleCelebration.displayName = "ParticleCelebration";
export default ParticleCelebration;
