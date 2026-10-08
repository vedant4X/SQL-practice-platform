"use client";

import React, { useRef, useState, MouseEvent } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 8,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [sheenPosition, setSheenPosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`
    );

    setSheenPosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSheenPosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: transformStyle ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        transformStyle: "preserve-3d",
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Specular Holographic Glare Sheen */}
      <div
        className="pointer-events-none absolute inset-0 rounded-inherit transition-opacity duration-300"
        style={{
          opacity: sheenPosition.opacity,
          background: `radial-gradient(circle 280px at ${sheenPosition.x}% ${sheenPosition.y}%, rgba(255, 255, 255, 0.4), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
