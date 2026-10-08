"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme/ThemeContext";

interface CyberWarpBackgroundProps {
  typingIntensity?: number; // 0 to 1, ramps up as user types
}

export default function CyberWarpBackground({ typingIntensity = 0 }: CyberWarpBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const intensityRef = useRef(typingIntensity);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const offsetRef = useRef(0);

  useEffect(() => {
    intensityRef.current = typingIntensity;
  }, [typingIntensity]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === "dark";
      const intensity = intensityRef.current;

      // Base speed + warp-speed boost when typing
      const speed = 0.8 + intensity * 4.2;
      offsetRef.current = (offsetRef.current + speed) % 50;

      // Horizon & vanishing point influenced by mouse & typing
      const horizonY = height * 0.42 + (mouseRef.current.y - 0.5) * 60;
      const vanishingX = width * 0.5 + (mouseRef.current.x - 0.5) * 120 + Math.sin(Date.now() * 0.002) * (intensity * 25);

      // Subtle background ambient gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDark) {
        bgGrad.addColorStop(0, "#080811");
        bgGrad.addColorStop(0.5, "#0d0d1a");
        bgGrad.addColorStop(1, "#141026");
      } else {
        bgGrad.addColorStop(0, "#faf8f4");
        bgGrad.addColorStop(0.5, "#f4eee4");
        bgGrad.addColorStop(1, "#ebdcc9");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // PERSPECTIVE WARP GRID
      ctx.save();
      const numLines = 26;
      const gridColor = isDark
        ? intensity > 0.3
          ? `rgba(255, 0, 127, ${0.15 + intensity * 0.25})`
          : "rgba(0, 240, 255, 0.14)"
        : intensity > 0.3
        ? `rgba(255, 77, 0, ${0.18 + intensity * 0.2})`
        : "rgba(0, 34, 255, 0.12)";

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = intensity > 0.5 ? 1.6 : 1.1;

      // Perspective Lines (Radiating from horizon vanishing point)
      for (let i = -numLines; i <= numLines; i++) {
        const bottomX = width * 0.5 + i * (width / 18);
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal Moving Scanning Lines
      const numHoriz = 16;
      for (let j = 0; j < numHoriz; j++) {
        // Logarithmic / exponential spacing for 3D depth
        const progress = ((j * 3.5 + offsetRef.current / 14) % numHoriz) / numHoriz;
        const y = horizonY + Math.pow(progress, 2.2) * (height - horizonY);

        if (y > horizonY) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Digital horizon neon beam
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.strokeStyle = isDark
        ? `rgba(0, 240, 255, ${0.3 + intensity * 0.5})`
        : `rgba(0, 34, 255, ${0.25 + intensity * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Atmospheric glowing horizon glow
      const horizonGlow = ctx.createRadialGradient(
        vanishingX,
        horizonY,
        10,
        vanishingX,
        horizonY,
        width * 0.6
      );
      if (isDark) {
        horizonGlow.addColorStop(0, `rgba(57, 255, 20, ${0.08 + intensity * 0.2})`);
        horizonGlow.addColorStop(0.4, `rgba(255, 0, 127, ${0.05 + intensity * 0.15})`);
        horizonGlow.addColorStop(1, "rgba(10, 10, 18, 0)");
      } else {
        horizonGlow.addColorStop(0, `rgba(255, 77, 0, ${0.09 + intensity * 0.15})`);
        horizonGlow.addColorStop(0.5, `rgba(121, 40, 202, ${0.04 + intensity * 0.1})`);
        horizonGlow.addColorStop(1, "rgba(251, 249, 245, 0)");
      }
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-300"
    />
  );
}
