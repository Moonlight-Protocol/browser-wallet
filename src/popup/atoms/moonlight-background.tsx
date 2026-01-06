import React from "react";
import { LogoIcon } from "@/popup/icons/index.tsx";

export function MoonlightBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Concentric Circles (Bands of light) */}
        {/* Using pure colors with decreasing opacity to create a stepped gradient effect */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-400 animate-breathe"
          style={
            {
              "--min-opacity": 0.02,
              "--max-opacity": 0.04,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full bg-blue-400 animate-breathe"
          style={
            {
              "--min-opacity": 0.03,
              "--max-opacity": 0.05,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-400 animate-breathe"
          style={
            {
              "--min-opacity": 0.04,
              "--max-opacity": 0.06,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-blue-400 animate-breathe"
          style={
            {
              "--min-opacity": 0.05,
              "--max-opacity": 0.08,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-blue-400 animate-breathe"
          style={
            {
              "--min-opacity": 0.06,
              "--max-opacity": 0.1,
            } as React.CSSProperties
          }
        />

        {/* The Moon */}
        {/* Positioned to clip about 30% at the top */}
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 animate-pulse-moon">
          <LogoIcon className="w-96 h-96 text-foreground" />
        </div>
      </div>
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
