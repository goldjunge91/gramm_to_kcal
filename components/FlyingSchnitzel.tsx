"use client";
import { motion, useAnimation } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// --- Constants ---
const SCHNITZEL_SIZE = 150;
const SPEED = 6; // Pixel pro Frame

export default function FlyingSchnitzel() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const animationControls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Position und Richtung
  const posRef = useRef({ x: 100, y: 100 });
  const dirRef = useRef({ dx: SPEED, dy: SPEED });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let animationFrame: number;

    const animate = () => {
      const { width, height } = containerRef.current!.getBoundingClientRect();
      let { x, y } = posRef.current;
      let { dx, dy } = dirRef.current;

      // Neue Position berechnen
      x += dx;
      y += dy;

      // Kollision mit den Wänden prüfen und Richtung umkehren
      if (x <= 0) {
        x = 0;
        dx = Math.abs(dx);
      }
      if (x >= width - SCHNITZEL_SIZE) {
        x = width - SCHNITZEL_SIZE;
        dx = -Math.abs(dx);
      }
      if (y <= 0) {
        y = 0;
        dy = Math.abs(dy);
      }
      if (y >= height - SCHNITZEL_SIZE) {
        y = height - SCHNITZEL_SIZE;
        dy = -Math.abs(dy);
      }

      posRef.current = { x, y };
      dirRef.current = { dx, dy };

      animationControls.set({ x, y, rotate: x + y });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [mounted, animationControls]);

  if (!mounted || theme !== "gunter") return null;

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <style>{`
        .debug-circle {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          border-radius: 50%;
          z-index: 10000;
        }
      `}</style>

      <motion.div
        id="schnitzel-container"
        animate={animationControls}
        style={{
          width: SCHNITZEL_SIZE,
          height: SCHNITZEL_SIZE,
          position: "absolute",
          zIndex: 9999,
        }}
      >
        <img
          src="/wiener_schnitzel.jpg"
          alt="Ein fliegendes Schnitzel"
          style={{ width: "100%", height: "100%", borderRadius: "50%" }}
        />
        <div
          className="debug-circle"
          style={{
            width: SCHNITZEL_SIZE,
            height: SCHNITZEL_SIZE,
            border: "2px solid blue",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </motion.div>
    </div>
  );
}
