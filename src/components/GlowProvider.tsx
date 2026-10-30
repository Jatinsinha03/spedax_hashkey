"use client";

import React, { useEffect } from "react";

export function GlowProvider() {
  useEffect(() => {
    const pg = document.getElementById("pg");
    const glow = document.getElementById("glow");

    let gx = 0;
    let gy = 0;
    let gq = 0;

    const handlePointerMove = (e: PointerEvent) => {
      // Spotlight on hovered .card
      const target = e.target as HTMLElement | null;
      const card = target?.closest?.(".card, .openui-card") as HTMLElement | null;
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }

      // Cursor glow
      if (glow && e.pointerType !== "touch") {
        gx = e.clientX;
        gy = e.clientY;
        if (!gq) {
          gq = 1;
          requestAnimationFrame(() => {
            gq = 0;
            glow.style.opacity = "1";
            glow.style.transform = `translate(${gx}px, ${gy}px)`;
          });
        }
      }
    };

    let sq = 0;
    const handleScroll = () => {
      if (!sq) {
        sq = 1;
        requestAnimationFrame(() => {
          sq = 0;
          if (pg) {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            pg.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
          }
        });
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div id="pg" aria-hidden="true" />
      <div id="glow" aria-hidden="true" />
    </>
  );
}
