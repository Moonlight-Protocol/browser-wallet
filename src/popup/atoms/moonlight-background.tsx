import React, { useMemo } from "react";
import { LogoIcon } from "@/popup/icons/index.tsx";

// Generate random stars with consistent positions
function generateStars(count: number, seed: number = 42) {
  const stars = [];
  let random = seed;
  const pseudoRandom = () => {
    random = (random * 1103515245 + 12345) % 2147483648;
    return random / 2147483648;
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: pseudoRandom() * 100,
      top: pseudoRandom() * 100,
      size: pseudoRandom() * 2 + 1,
      opacity: pseudoRandom() * 0.5 + 0.3,
      duration: pseudoRandom() * 3 + 2,
      delay: pseudoRandom() * 5,
    });
  }
  return stars;
}

export function MoonlightBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  const stars = useMemo(() => generateStars(50), []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 100% at 50% -20%, 
              oklch(0.22 0.06 280 / 0.8) 0%, 
              oklch(0.15 0.04 265) 40%, 
              oklch(0.12 0.035 265) 100%
            )
          `,
        }}
      />

      {/* Aurora effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 30% 20%, 
              oklch(0.55 0.20 300 / 0.3) 0%, 
              transparent 70%
            ),
            radial-gradient(ellipse 60% 40% at 70% 30%, 
              oklch(0.75 0.18 45 / 0.2) 0%, 
              transparent 60%
            )
          `,
        }}
      />

      {/* Stars layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--star-opacity": star.opacity,
              "--twinkle-duration": `${star.duration}s`,
              "--twinkle-delay": `${star.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Glow rings around moon */}
      <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
        {/* Outer purple glow ring */}
        <div
          className="absolute top-[-20px] left-1/2 w-[500px] h-[500px] rounded-full animate-glow-ring"
          style={{
            background:
              `radial-gradient(circle, transparent 45%, oklch(0.55 0.20 300 / 0.08) 50%, oklch(0.55 0.20 300 / 0.15) 55%, transparent 65%)`,
            "--ring-min-opacity": 0.5,
            "--ring-max-opacity": 0.8,
            "--ring-duration": "8s",
            "--ring-delay": "0s",
          } as React.CSSProperties}
        />

        {/* Middle orange glow ring */}
        <div
          className="absolute top-[0px] left-1/2 w-[400px] h-[400px] rounded-full animate-glow-ring"
          style={{
            background:
              `radial-gradient(circle, transparent 40%, oklch(0.75 0.18 45 / 0.1) 48%, oklch(0.75 0.18 45 / 0.2) 55%, transparent 65%)`,
            "--ring-min-opacity": 0.6,
            "--ring-max-opacity": 1,
            "--ring-duration": "6s",
            "--ring-delay": "1s",
          } as React.CSSProperties}
        />

        {/* Inner golden glow ring */}
        <div
          className="absolute top-[20px] left-1/2 w-[320px] h-[320px] rounded-full animate-glow-ring"
          style={{
            background:
              `radial-gradient(circle, transparent 35%, oklch(0.85 0.15 55 / 0.15) 45%, oklch(0.85 0.15 55 / 0.25) 52%, transparent 62%)`,
            "--ring-min-opacity": 0.7,
            "--ring-max-opacity": 1,
            "--ring-duration": "5s",
            "--ring-delay": "0.5s",
          } as React.CSSProperties}
        />

        {/* Moon halo glow */}
        <div
          className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full"
          style={{
            background: `radial-gradient(circle, 
              oklch(0.85 0.12 55 / 0.4) 0%, 
              oklch(0.75 0.15 45 / 0.2) 30%, 
              oklch(0.55 0.18 300 / 0.1) 60%, 
              transparent 80%
            )`,
            filter: "blur(20px)",
          }}
        />

        {/* The Moon with enhanced glow */}
        <div className="absolute top-[0px] left-1/2 -translate-x-1/2 animate-pulse-moon animate-float">
          <div
            className="relative"
            style={{
              filter: "drop-shadow(0 0 30px oklch(0.85 0.15 55 / 0.5))",
            }}
          >
            <LogoIcon className="w-64 h-64" />
          </div>
        </div>
      </div>

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
