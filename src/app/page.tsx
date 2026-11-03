"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VaultTokenDistribution } from "@/components/VaultTokenDistribution";

export default function LandingPage() {
  // DOM Refs for interactive canvases
  const hbRef = useRef<HTMLCanvasElement | null>(null);
  const c1Ref = useRef<HTMLCanvasElement | null>(null);
  const c2Ref = useRef<HTMLCanvasElement | null>(null);
  const c3Ref = useRef<HTMLCanvasElement | null>(null);
  const c4Ref = useRef<HTMLCanvasElement | null>(null);

  // Stats Counters
  const [approvedCount, setApprovedCount] = useState(0);
  const [revertedCount, setRevertedCount] = useState(0);

  // Settings Toggles
  const [motionOn, setMotionOn] = useState(true);
  const [feedOn, setFeedOn] = useState(true);
  const [glowOn, setGlowOn] = useState(true);

  // Terminal & Market State
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h">("1m");
  const [marketPrice, setMarketPrice] = useState("0.0884");
  const [priceChange, setPriceChange] = useState("+0.42%");
  const [sessionHigh, setSessionHigh] = useState("0.0910");
  const [sessionLow, setSessionLow] = useState("0.0862");
  const [simVolume, setSimVolume] = useState("1.84M");

  // Mandate Simulator State
  const [maxTradePct, setMaxTradePct] = useState(10);
  const [lossLimitPct, setLossLimitPct] = useState(5);
  const [slippageBps, setSlippageBps] = useState(50);
  const [allowedPairs, setAllowedPairs] = useState<Record<string, boolean>>({
    "HSK/USDT": true,
    "WETH/USDT": true,
    "WBTC/USDT": true,
    "PEPE/USDT": false,
  });
  const [simBalance, setSimBalance] = useState(10000);
  const [simStartBalance, setSimStartBalance] = useState(10000);
  const [simFrozen, setSimFrozen] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState<Array<{ tag: string; msg: string; type: "x" | "r" | "f" | "o" }>>([
    { tag: "READY", msg: "Vault deployed on HashKey Chain. Mandate loaded.", type: "o" },
  ]);

  // Chat simulator state
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "bot" | "me"; text: string; card?: { title: string; desc: string; onConfirm: () => void } | null; blocked?: boolean }>
  >([
    { sender: "bot", text: "Hi, I'm your HashPilot agent. Tell me what rules to modify, or pick an example prompt below." },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Spread hunting feed
  const [spreadBps, setSpreadBps] = useState(24);
  const [spreadFeed, setSpreadFeed] = useState<string[]>([
    "Bought 4,500 HSK on Uniswap V3 Pool A at 0.0881 USDT, sold on Pool B at 0.0884 USDT. Net +0.31% after gas fees.",
  ]);

  // Documentation tab state
  const [activeDocTab, setActiveDocTab] = useState<
    "intro" | "start" | "mandate" | "breaker" | "chat" | "security" | "faq"
  >("intro");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Registration agent state
  const [regStep, setRegStep] = useState(0);
  const [regData, setRegData] = useState<Record<string, string>>({});
  const [regInput, setRegInput] = useState("");
  const [regMessages, setRegMessages] = useState<Array<{ sender: "bot" | "me"; text: string; options?: string[] }>>([
    { sender: "bot", text: "Hey! I'm the HashPilot onboarding agent. What should I call you?" },
  ]);

  // Waitlist form state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Settings sync
  useEffect(() => {
    document.documentElement.dataset.motion = motionOn ? "on" : "off";
    const glowEl = document.getElementById("glow");
    if (glowEl) {
      glowEl.style.display = glowOn ? "" : "none";
    }
  }, [motionOn, glowOn]);

  // Reveal Animations on Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );

    document.querySelectorAll(".rv, .split").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll-driven manifesto highlight
  useEffect(() => {
    const mani = document.getElementById("mani");
    if (!mani) return;
    const spans = mani.querySelectorAll("span");

    const onScroll = () => {
      const rect = mani.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.9 - rect.top) / (window.innerHeight * 0.55), 0), 1);
      const count = Math.round(p * spans.length);
      spans.forEach((span, i) => {
        span.classList.toggle("lit", i < count);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --------------------------------------------------------------------------
  // CANVAS 1: Hero Trade Blocks (#hb)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = hbRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let approved = 0;
    let reverted = 0;
    let spawnTimer = 0;

    interface Block {
      x: number;
      y: number;
      s: number;
      v: number;
      label: string;
      bad: boolean;
      st: number; // 0=travelling, 1=approved, 2=reverted
      al: number;
      vy: number;
    }

    interface Pulse {
      y: number;
      a: number;
      bad: boolean;
    }

    const blocks: Block[] = [];
    const pulses: Pulse[] = [];
    const hex4 = () => ((Math.random() * 65536) | 0).toString(16).padStart(4, "0");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const makeBlock = (w: number, h: number, x: number, lineX: number): Block => {
      const s = 26 + Math.random() * 36;
      const bad = Math.random() < 0.22;
      let st = 0;
      if (x + s / 2 >= lineX) {
        if (bad) x = Math.random() * lineX * 0.85;
        else st = 1;
      }
      return {
        x,
        y: h * 0.08 + Math.random() * h * 0.84,
        s,
        v: 30 + Math.random() * 50,
        label: hex4(),
        bad,
        st,
        al: 1,
        vy: 0,
      };
    };

    const loop = (time: number) => {
      const dt = Math.min(Math.max((time - lastTime) / 1000, 0), 0.05);
      lastTime = time;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      const lineX = w * (w < 900 ? 0.84 : 0.78);
      const cap = w < 700 ? 15 : 28;

      spawnTimer -= dt;
      if (spawnTimer <= 0 && blocks.length < cap) {
        spawnTimer = 0.35 + Math.random() * 0.45;
        blocks.push(makeBlock(w, h, -60, lineX));
      }

      // Barrier glow line
      const lg = ctx.createLinearGradient(lineX - 70, 0, lineX + 70, 0);
      lg.addColorStop(0, "rgba(124, 58, 237, 0)");
      lg.addColorStop(0.5, "rgba(124, 58, 237, 0.4)");
      lg.addColorStop(1, "rgba(124, 58, 237, 0)");
      ctx.fillStyle = lg;
      ctx.fillRect(lineX - 70, 0, 140, h);

      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(lineX - 1, 0, 2, h);

      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (b.st === 2) {
          b.vy += 540 * dt;
          b.y += b.vy * dt;
          b.al -= dt * 1.2;
          if (b.al <= 0) {
            blocks.splice(i, 1);
            continue;
          }
        } else {
          b.x += b.v * dt;
          if (b.st === 0 && b.x + b.s / 2 >= lineX) {
            if (b.bad) {
              b.st = 2;
              b.vy = -60;
              reverted++;
              setRevertedCount(reverted);
            } else {
              b.st = 1;
              approved++;
              setApprovedCount(approved);
            }
            pulses.push({ y: b.y + b.s / 2, a: 0, bad: b.bad });
          }
          if (b.x > w + 80) {
            blocks.splice(i, 1);
            continue;
          }
        }

        // Draw block
        const cx = b.x + b.s / 2;
        const cy = b.y + b.s / 2;
        const r = Math.max(6, b.s * 0.2);
        ctx.globalAlpha = Math.max(b.al, 0);

        if (b.st === 1) {
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = "rgba(167, 139, 250, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lineX, cy);
          ctx.lineTo(b.x, cy);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.shadowColor = "#7c3aed";
          ctx.shadowBlur = 16;
          ctx.fillStyle = "#7c3aed";
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.s, b.s, r);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "#c4b5fd";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (b.st === 2) {
          ctx.fillStyle = "rgba(246, 70, 93, 0.16)";
          ctx.strokeStyle = "#f6465d";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.s, b.s, r);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.s, b.s, r);
          ctx.fill();
          ctx.stroke();
        }

        ctx.font = `500 ${Math.max(9, b.s * 0.24)}px var(--font-mono), monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = b.st === 1 ? "#fff" : b.st === 2 ? "#f6465d" : "rgba(255, 255, 255, 0.5)";
        ctx.fillText(b.st === 2 ? "✕" : b.label, cx, cy);

        // Checkmark for approved
        if (b.st === 1 && b.s > 32) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.s - 16, b.y + 9);
          ctx.lineTo(b.x + b.s - 12, b.y + 13);
          ctx.lineTo(b.x + b.s - 6, b.y + 5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Barrier collision pulse rings
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.a += dt;
        if (p.a > 0.85) {
          pulses.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = p.bad ? "#f6465d" : "#a78bfa";
        ctx.globalAlpha = 1 - p.a / 0.85;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lineX, p.y, 8 + p.a * 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (motionOn) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [motionOn]);

  // --------------------------------------------------------------------------
  // CANVAS 2: Candlestick Market Terminal (#c1)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = c1Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const BASE = 0.0884;
    const candles: Array<{ o: number; c: number; h: number; l: number; v: number }> = [];
    const candleCount = 100;
    let currP = BASE;

    for (let i = 0; i < candleCount; i++) {
      const nextP = currP + (Math.random() - 0.5) * 0.0012 + (BASE - currP) * 0.05;
      candles.push({
        o: currP,
        c: nextP,
        h: Math.max(currP, nextP) + Math.random() * 0.0008,
        l: Math.min(currP, nextP) - Math.random() * 0.0008,
        v: 25 + Math.random() * 85,
      });
      currP = nextP;
    }

    let acc = 0;
    let lastTime = performance.now();
    let mouseX = -1;
    let mouseY = -1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouseX = -1;
      mouseY = -1;
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      acc += dt * 1000;
      const stepDuration = timeframe === "1m" ? 800 : timeframe === "5m" ? 1200 : 1800;

      if (feedOn && acc >= stepDuration) {
        acc = 0;
        const lastCandle = candles[candles.length - 1];
        const nextC = lastCandle.c + (Math.random() - 0.5) * 0.0012 + (BASE - lastCandle.c) * 0.04;
        candles.shift();
        candles.push({
          o: lastCandle.c,
          c: nextC,
          h: Math.max(lastCandle.c, nextC) + Math.random() * 0.0006,
          l: Math.min(lastCandle.c, nextC) - Math.random() * 0.0006,
          v: 30 + Math.random() * 80,
        });

        const latest = candles[candles.length - 1];
        const change = ((latest.c - candles[0].o) / candles[0].o) * 100;
        setMarketPrice(latest.c.toFixed(4));
        setPriceChange((change >= 0 ? "+" : "") + change.toFixed(2) + "%");
      }

      ctx.clearRect(0, 0, w, h);
      const pw = w - 68;
      const pTop = 32;
      const vh = h * 0.16;
      const pBottom = h - vh - 14;
      const nv = Math.max(30, Math.min(80, Math.floor((w - 70) / 12)));
      const visibleCandles = candles.slice(candles.length - nv);
      const cw = pw / nv;
      const bw = Math.max(cw * 0.65, 2);

      let minP = Infinity;
      let maxP = -Infinity;
      let maxV = 0;

      visibleCandles.forEach((c) => {
        minP = Math.min(minP, c.l);
        maxP = Math.max(maxP, c.h);
        maxV = Math.max(maxV, c.v);
      });

      const pad = (maxP - minP) * 0.12 || 0.001;
      minP -= pad;
      maxP += pad;

      const toY = (val: number) => pBottom - ((val - minP) / (maxP - minP)) * (pBottom - pTop);

      // Price grid lines
      ctx.font = "10.5px var(--font-mono), monospace";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= 5; i++) {
        const y = pTop + ((pBottom - pTop) * i) / 5;
        const val = maxP - ((maxP - minP) * i) / 5;
        ctx.strokeStyle = "#1e2329";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(pw, y);
        ctx.stroke();

        ctx.fillStyle = "#848e9c";
        ctx.textAlign = "left";
        ctx.fillText(val.toFixed(4), pw + 8, y);
      }

      // Candlesticks and volume bars
      visibleCandles.forEach((c, idx) => {
        const x = (idx + 0.5) * cw;
        const up = c.c >= c.o;
        const col = up ? "#0ecb81" : "#f6465d";

        // Volume bar
        const vb = (c.v / maxV) * vh * 0.9;
        ctx.fillStyle = up ? "rgba(14, 203, 129, 0.35)" : "rgba(246, 70, 93, 0.35)";
        ctx.fillRect(x - bw / 2, h - 8 - vb, bw, vb);

        // Candle wick
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, toY(c.h));
        ctx.lineTo(x, toY(c.l));
        ctx.stroke();

        // Candle body
        const y1 = toY(Math.max(c.o, c.c));
        const bh = Math.max(Math.abs(toY(c.o) - toY(c.c)), 1.5);
        ctx.fillStyle = col;
        ctx.fillRect(x - bw / 2, y1, bw, bh);
      });

      // Crosshair if hovering
      if (mouseX >= 0 && mouseX < pw && mouseY >= 0 && mouseY <= h) {
        ctx.strokeStyle = "#5e6673";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mouseX, 0);
        ctx.lineTo(mouseX, h);
        ctx.moveTo(0, mouseY);
        ctx.lineTo(pw, mouseY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (feedOn) {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [timeframe, feedOn]);

  // --------------------------------------------------------------------------
  // CANVAS 3: Two-Pool Spread Arbitrage (#c2)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = c2Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const count = 120;
    const poolA: number[] = [];
    const poolB: number[] = [];
    let pA = 0;
    let pB = 0;

    for (let i = 0; i < count; i++) {
      pA += (Math.random() - 0.5) * 12 - pA * 0.012;
      pB += (pA - pB) * 0.12 + (Math.random() - 0.5) * 4;
      poolA.push(pA);
      poolB.push(pB);
    }

    let acc = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      acc += dt * 1000;
      if (acc >= 90) {
        acc = 0;
        pA += (Math.random() - 0.5) * 14 - pA * 0.012;
        pB += (pA - pB) * 0.12 + (Math.random() - 0.5) * 4;
        poolA.shift();
        poolB.shift();
        poolA.push(pA);
        poolB.push(pB);

        const gap = Math.abs(pA - pB);
        setSpreadBps(Math.round(gap));

        if (gap > 22 && Math.random() < 0.25) {
          const buyPool = pA < pB ? "Pool A (0.3%)" : "Pool B (0.05%)";
          const sellPool = pA < pB ? "Pool B (0.05%)" : "Pool A (0.3%)";
          const profit = ((gap - 6) / 100).toFixed(2);
          setSpreadFeed((prev) => [
            `Arbitrage Cycle: Bought USDT ➔ WETH on ${buyPool}, swapped to USDT on ${sellPool}. Net +${profit}% captured by HashPilot vault.`,
            ...prev.slice(0, 2),
          ]);
        }
      }

      ctx.clearRect(0, 0, w, h);
      const pw = w - 62;
      const minVal = Math.min(...poolA, ...poolB) - 6;
      const maxVal = Math.max(...poolA, ...poolB) + 6;

      const toX = (i: number) => (i / (count - 1)) * pw;
      const toY = (v: number) => h - 14 - ((v - minVal) / (maxVal - minVal)) * (h - 28);

      // Highlight arbitrage spread gaps in emerald
      const sw = pw / (count - 1) + 1;
      ctx.fillStyle = "rgba(14, 203, 129, 0.22)";
      for (let i = 0; i < poolA.length; i++) {
        const d = poolA[i] - poolB[i];
        if (Math.abs(d) > 16) {
          const y1 = toY(poolA[i]);
          const y2 = toY(poolB[i]);
          ctx.fillRect(toX(i) - sw / 2, Math.min(y1, y2), sw, Math.abs(y1 - y2));
        }
      }

      // Line for Pool B (Yellow)
      ctx.beginPath();
      poolB.forEach((v, i) => (i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v))));
      ctx.strokeStyle = "#f0b90b";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Line for Pool A (White)
      ctx.beginPath();
      poolA.forEach((v, i) => (i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v))));
      ctx.strokeStyle = "#eaecef";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      if (feedOn) {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [feedOn]);

  // --------------------------------------------------------------------------
  // CANVAS 4: Mandate Simulator Equity Curve (#c3)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = c3Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const history = Array.from({ length: 60 }, () => simBalance);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      const pw = w - 62;
      const pTop = 18;
      const pBottom = h - 16;
      const limitVal = simStartBalance * (1 - lossLimitPct / 100);

      const minV = Math.min(limitVal, ...history) * 0.98;
      const maxV = Math.max(simStartBalance, ...history) * 1.02;

      const toX = (i: number) => pw - (history.length - 1 - i) * (pw / (history.length - 1));
      const toY = (v: number) => pBottom - ((v - minV) / (maxV - minV)) * (pBottom - pTop);

      // Loss limit zone shading
      const yLimit = toY(limitVal);
      if (yLimit < pBottom) {
        ctx.fillStyle = "rgba(246, 70, 93, 0.1)";
        ctx.fillRect(0, yLimit, pw, pBottom - yLimit);
      }

      // Limit line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#f6465d";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yLimit);
      ctx.lineTo(pw, yLimit);
      ctx.stroke();

      // Start line
      ctx.strokeStyle = "#5e6673";
      ctx.beginPath();
      ctx.moveTo(0, toY(simStartBalance));
      ctx.lineTo(pw, toY(simStartBalance));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "10.5px var(--font-mono), monospace";
      ctx.fillStyle = "#f6465d";
      ctx.textAlign = "left";
      ctx.fillText(`-$${(simStartBalance * (lossLimitPct / 100)).toFixed(0)} limit`, pw + 6, yLimit);

      // Equity curve line
      ctx.beginPath();
      history.forEach((v, i) => (i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v))));
      const col = simBalance >= simStartBalance ? "#0ecb81" : "#f6465d";
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [simBalance, simStartBalance, lossLimitPct]);

  // --------------------------------------------------------------------------
  // CANVAS 5: HashKey Block Stream (#c4)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = c4Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let pos = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      const bw = w < 600 ? 150 : 180;
      const bh = 104;
      const gap = 64;
      const uw = bw + gap;
      pos += dt * 38;

      const baseBlock = Math.floor(pos / uw);
      const off = pos % uw;
      const y = (h - bh) / 2 + 8;
      const count = Math.ceil(w / uw) + 2;

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      for (let i = 0; i < count; i++) {
        const n = baseBlock + i + 128450;
        const x = i * uw - off + 16;
        const fresh = x > w - uw * 1.15;

        // Connecting chain link
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + bw, y + bh / 2);
        ctx.lineTo(x + uw, y + bh / 2);
        ctx.stroke();

        // Block card
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 16);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        ctx.setLineDash(fresh ? [5, 5] : []);
        ctx.strokeStyle = fresh ? "#ddd6fe" : "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = "600 12px var(--font-mono), monospace";
        ctx.fillStyle = "#fff";
        ctx.fillText(`Block #${n}`, x + 14, y + 24);

        ctx.font = "500 11px var(--font-mono), monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(`${12 + ((n * 13) % 24)} txs`, x + 14, y + 46);
        ctx.fillText(`0x${((n * 2654435761) >>> 0).toString(16).slice(0, 8)}`, x + 14, y + 66);

        if (n % 2 === 0) {
          ctx.beginPath();
          ctx.roundRect(x + 14, y + 78, bw - 28, 18, 9);
          ctx.fillStyle = "#7c3aed";
          ctx.fill();

          ctx.font = "500 10px var(--font-mono), monospace";
          ctx.fillStyle = "#fff";
          ctx.fillText("vault swap ✓", x + 22, y + 87.5);
        }
      }

      if (motionOn) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [motionOn]);

  // Mandate Simulator Rogue Trade Actions
  const runTradeAttempt = (trade: { pair: string; pct: number; slip: number; label: string; kind?: string }) => {
    let revertMsg = "";

    if (simFrozen) {
      revertMsg = "AgentFrozen: circuit breaker is active on-chain";
    } else if (trade.kind === "wd") {
      revertMsg = "NotOwner: agent has zero withdrawal permissions";
    } else if (!allowedPairs[trade.pair]) {
      revertMsg = `TokenNotAllowed: ${trade.pair}`;
    } else if (trade.pct > maxTradePct) {
      revertMsg = `PositionTooLarge: ${trade.pct}% > ${maxTradePct}% allowed`;
    } else if (trade.slip > slippageBps) {
      revertMsg = `SlippageTooHigh: ${trade.slip}bps > ${slippageBps}bps cap`;
    }

    if (revertMsg) {
      setSimLogs((prev) => [
        { tag: "REVERT", msg: `${trade.label} → ${revertMsg}`, type: "r" },
        ...prev.slice(0, 20),
      ]);
      return;
    }

    // Successful execution inside mandate
    const pnl = simBalance * (trade.pct / 100) * ((Math.random() - 0.48) * 0.08);
    const newBal = simBalance + pnl;
    setSimBalance(newBal);

    setSimLogs((prev) => [
      {
        tag: "EXEC",
        msg: `${trade.label} → ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} USDT`,
        type: "x",
      },
      ...prev.slice(0, 20),
    ]);

    // Check circuit breaker freeze
    if ((simStartBalance - newBal) / simStartBalance >= lossLimitPct / 100) {
      setSimFrozen(true);
      setSimRunning(false);
      setSimLogs((prev) => [
        { tag: "FREEZE", msg: "Daily loss floor reached. Agent halted by smart contract circuit breaker.", type: "f" },
        ...prev.slice(0, 20),
      ]);
    }
  };

  const handleUnfreeze = () => {
    setSimFrozen(false);
    setSimStartBalance(simBalance);
    setSimLogs((prev) => [
      { tag: "OWNER", msg: "Owner signed unfreeze transaction. New daily high-water mark established.", type: "o" },
      ...prev.slice(0, 20),
    ]);
  };

  // Chat proposal simulator
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");

    setChatMessages((prev) => [...prev, { sender: "me", text }]);

    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes("drain") || lower.includes("withdraw") || lower.includes("send")) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Blocked. Conversation can draft mandate rules, but can never move money. Vault withdrawals can only be signed directly by the owner wallet.",
            blocked: true,
          },
        ]);
      } else if (lower.includes("loss") || lower.includes("limit") || lower.includes("cap")) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Understood. I drafted a rule card to tighten your daily loss limit to 2%.",
            card: {
              title: "Daily Loss Limit",
              desc: `${lossLimitPct}% → 2%`,
              onConfirm: () => setLossLimitPct(2),
            },
          },
        ]);
      } else if (lower.includes("pepe") || lower.includes("pair")) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Adding a token pair expands the vault's trading surface. Please confirm this mandate card.",
            card: {
              title: "Allowed Token Whitelist",
              desc: "+ PEPE/USDT",
              onConfirm: () => setAllowedPairs((p) => ({ ...p, "PEPE/USDT": true })),
            },
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "I can draft rule-change cards for your review. Try: 'cap my daily loss at 2%', 'allow PEPE/USDT', or 'pause the agent'.",
          },
        ]);
      }
    }, 450);
  };

  // Registration Bot Form
  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regInput.trim()) return;
    const text = regInput.trim();
    setRegInput("");

    setRegMessages((prev) => [...prev, { sender: "me", text }]);

    setTimeout(() => {
      if (regStep === 0) {
        setRegData((d) => ({ ...d, name: text }));
        setRegStep(1);
        setRegMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Great to meet you, ${text}. What email should receive your invite link?` },
        ]);
      } else if (regStep === 1) {
        setRegData((d) => ({ ...d, email: text }));
        setRegStep(2);
        setRegMessages((prev) => [
          ...prev,
          { sender: "bot", text: "What is your owner wallet address on HashKey Chain (0x...)? It retains 100% custody of the vault." },
        ]);
      } else if (regStep === 2) {
        setRegData((d) => ({ ...d, wallet: text }));
        setRegStep(3);
        setRegMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Which mandate preset would you like to start with?",
            options: ["Conservative (2% max loss)", "Balanced (5% max loss)", "Active (10% max loss)"],
          },
        ]);
      } else if (regStep === 3) {
        setRegData((d) => ({ ...d, preset: text }));
        setRegStep(4);
        setRegMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Vault pre-registration ready for ${regData.name || "Owner"}! Ready to deploy your contract on HashKey Chain.`,
          },
        ]);
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col w-full selection:bg-[#7c3aed] selection:text-white">
      {/* -------------------------------------------------------------------- */}
      {/* SECTION 1: HERO (Dark, Interactive Trade Blocks Canvas)             */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark hero" id="top">
        <canvas id="hb" ref={hbRef} aria-hidden="true" />
        <div className="wrap">
          <div className="rv mb-4">
            <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white uppercase inline-block">
              HashPilot
            </span>
          </div>
          <span className="mono tag rv">Built for HashKey Chain Mainnet</span>
          <h1 className="split text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mt-1 mb-4">
            The AI trades. <em>The contract decides.</em>
          </h1>
          <p className="lead rv" style={{ ["--d" as string]: ".3s" }}>
            HashPilot is a personal smart-contract trading vault on HashKey Chain. An autonomous AI agent hunts arbitrage and price spreads on Uniswap V3 (USDT, WHSK, WETH, WBTC) and reports back in plain language. It executes only inside a mandate enforced by the contract. Bad call, prompt injection, or a rogue key: anything out of bounds simply reverts.
          </p>
          <div className="row rv" style={{ ["--d" as string]: ".45s" }}>
            <Link className="btn lg" href="/onboarding">
              Create my vault
            </Link>
            <a className="btn lg k" href="#sim">
              Try to break the mandate
            </a>
          </div>
          <div className="stats rv" style={{ ["--d" as string]: ".6s" }}>
            <div>
              <b>
                <i>100</i>%
              </b>
              <span>of agent actions checked by the contract</span>
            </div>
            <div>
              <b>0</b>
              <span>keys that let the AI withdraw your funds</span>
            </div>
            <div>
              <b>
                <i>3</i>
              </b>
              <span>layers: mandate, circuit breaker, owner-only exits</span>
            </div>
          </div>
        </div>
        <div className="hstat mono" aria-hidden="true">
          no mandate, no trade
          <br />
          <span className="pl">
            approved <b>{approvedCount}</b>
          </span>
          <br />
          reverted <b>{revertedCount}</b>
        </div>
        <span className="cue" aria-hidden="true" />
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* MARQUEE BANNER                                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="mq" aria-hidden="true">
        <div className="mqi">
          <span>Non-custodial agent</span>
          <b>◆</b>
          <span>Mandate enforced on-chain</span>
          <b>◆</b>
          <span>HashKey Chain Mainnet</span>
          <b>◆</b>
          <span>Uniswap V3 Arbitrage</span>
          <b>◆</b>
          <span>Deterministic Circuit Breaker</span>
          <b>◆</b>
          <span>Plain-Language Gemini Reports</span>
          <b>◆</b>
          <span>Zero-Gas Signed Approvals</span>
          <b>◆</b>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 2: LIVE MARKET FEED TERMINAL                                */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark" id="market">
        <div className="wrap">
          <span className="mono tag rv">Live market feed (simulated)</span>
          <h2 className="split h">The agent watches every tick.</h2>
          <div className="term rv">
            <div className="th">
              <div className="pair">
                <b>HSK/USDT</b>
                <span className="mono dim">Uniswap V3 on HashKey Chain</span>
              </div>
              <div className="price">
                <b id="px" className="up">
                  {marketPrice}
                </b>
                <span id="pch" className="mono up">
                  {priceChange}
                </span>
              </div>
              <div className="kv">
                <span>Session high</span>
                <b id="hh">{sessionHigh}</b>
              </div>
              <div className="kv">
                <span>Session low</span>
                <b id="ll">{sessionLow}</b>
              </div>
              <div className="kv">
                <span>Volume (sim)</span>
                <b id="vv">{simVolume}</b>
              </div>
              <div className="tf" id="tf" role="group" aria-label="Timeframe">
                {(["1m", "5m", "15m", "1h"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`chip ${timeframe === tf ? "on" : ""}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <canvas id="c1" ref={c1Ref} role="img" aria-label="Simulated live candlestick chart" />
            <div className="tfoot mono">
              <span>Agent: scanning V3 pools (USDT, WHSK, WETH, WBTC)</span>
              <span>Hover the chart for a crosshair</span>
              <span>Mandate locked on-chain</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION: LIVE VAULT BALANCE & TOKEN DISTRIBUTION                     */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark border-t border-white/5" id="vault-assets">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="mono tag rv">On-Chain Asset Breakdown</span>
              <h2 className="split h mt-1 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Vault Balance &amp; Asset Distribution
              </h2>
            </div>
            <p className="lead rv text-sm sm:text-base max-w-xl text-slate-400 m-0">
              Transparently monitor your smart-contract vault balance and the live distribution across all supported tokens (USDT, WHSK, WETH, WBTC) on HashKey Chain Mainnet.
            </p>
          </div>
          <div className="rv">
            <VaultTokenDistribution />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 3: HOW IT WORKS (Light Section)                             */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec light" id="how">
        <div className="wrap">
          <span className="mono tag rv">01 / How it works</span>
          <h2 className="split h">An agent with a leash made of code.</h2>
          <div className="how">
            <div>
              <div className="step rv">
                <span className="mono">01</span>
                <h3>Create your vault</h3>
                <p>A personal smart-contract vault deployed on HashKey Chain, owned by your wallet. Fund it with USDT. Only you can withdraw.</p>
              </div>
              <div className="step rv">
                <span className="mono">02</span>
                <h3>Set the mandate</h3>
                <p>Max position size, daily volume limit, slippage cap, and allowed tokens (WHSK, WETH, WBTC). They live in the contract bytecode, not on a server.</p>
              </div>
              <div className="step rv">
                <span className="mono">03</span>
                <h3>The agent hunts spreads</h3>
                <p>It scans Uniswap V3 pools for arbitrage and price gaps and calls executeArbitrage. The contract guarantees Profit-or-Revert: any unprofitable trade reverts.</p>
              </div>
              <div className="step rv">
                <span className="mono">04</span>
                <h3>Reports in plain language</h3>
                <p>“I swapped 5.00 USDT via WETH 0.3% pool, net +0.31% after gas.” Powered by Google Gemini. Chat can propose rule cards, but can never move money.</p>
              </div>
            </div>
            <div className="dia rv">
              <svg viewBox="0 0 400 380" width="100%" role="img" aria-label="Architecture diagram">
                <rect className="n" x="14" y="16" width="130" height="54" rx="14" />
                <text x="79" y="40" textAnchor="middle">
                  YOU
                </text>
                <text x="79" y="57" textAnchor="middle" opacity=".6">
                  owner wallet
                </text>
                <rect className="n" x="256" y="16" width="130" height="54" rx="14" />
                <text x="321" y="40" textAnchor="middle">
                  AI AGENT
                </text>
                <text x="321" y="57" textAnchor="middle" opacity=".6">
                  trade-only key
                </text>
                <rect className="v" x="90" y="160" width="220" height="86" rx="18" />
                <text x="200" y="198" textAnchor="middle" style={{ fontWeight: 600 }}>
                  MANDATE VAULT
                </text>
                <text x="200" y="218" textAnchor="middle" opacity=".6">
                  smart contract · HashKey Chain
                </text>
                <rect className="n" x="120" y="316" width="160" height="50" rx="14" />
                <text x="200" y="346" textAnchor="middle">
                  Uniswap V3
                </text>
                <path className="fl" d="M79 70 L150 160" />
                <path className="fl w" d="M321 70 L250 160" />
                <path className="fl" d="M200 246 L200 316" />
                <circle className="gate" cx="285" cy="115" r="13" fill="#000" stroke="#f6465d" />
                <text className="gate" x="285" y="119" textAnchor="middle" style={{ fill: "#f6465d" }}>
                  ✕
                </text>
                <text x="30" y="125" opacity=".6">
                  rules · exits
                </text>
                <text x="212" y="288" opacity=".6">
                  approved swaps only
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 4: MANDATE SIMULATOR (Purple Section)                       */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec purple pgrid" id="sim">
        <div className="wrap">
          <span className="mono tag rv">02 / The mandate (interactive)</span>
          <h2 className="split h">Don&apos;t trust us. Try to break it.</h2>
          <p className="lead rv">
            Set your rules, run the simulated agent, then attack the vault. This runs the exact on-chain checks the HashPilot smart contract performs.
          </p>
          <div className="sim">
            {/* Control Column */}
            <div className="card ctl rv">
              <div className="top">
                <h3>Your mandate</h3>
                <span className="mono pl">ON-CHAIN</span>
              </div>
              <div className="chips">
                {[
                  { name: "Conservative", a: 5, b: 2, c: 30 },
                  { name: "Balanced", a: 10, b: 5, c: 50 },
                  { name: "Active", a: 25, b: 10, c: 100 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setMaxTradePct(preset.a);
                      setLossLimitPct(preset.b);
                      setSlippageBps(preset.c);
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <label>
                Max per trade <b>{maxTradePct}%</b>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={maxTradePct}
                onChange={(e) => setMaxTradePct(Number(e.target.value))}
                aria-label="Max per trade"
              />
              <label>
                Daily loss limit <b>{lossLimitPct}%</b>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={lossLimitPct}
                onChange={(e) => setLossLimitPct(Number(e.target.value))}
                aria-label="Daily loss limit"
              />
              <label>
                Max slippage <b>{slippageBps} bps</b>
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={slippageBps}
                onChange={(e) => setSlippageBps(Number(e.target.value))}
                aria-label="Max slippage"
              />
              <label>Allowed pairs</label>
              <div className="chips">
                {Object.keys(allowedPairs).map((pair) => (
                  <button
                    key={pair}
                    type="button"
                    className={`chip ${allowedPairs[pair] ? "on" : ""}`}
                    onClick={() => setAllowedPairs((p) => ({ ...p, [pair]: !p[pair] }))}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <p className="mono dim text-xs mt-3">
                Tip: set the loss limit to 1% and click &ldquo;Run agent&rdquo; to trip the smart contract circuit breaker.
              </p>
            </div>

            {/* Display / Chart Column */}
            <div className="card rv" style={{ ["--d" as string]: ".1s" }}>
              <div className="top">
                <div>
                  <span className="mono dim">VAULT BALANCE (DEMO)</span>
                  <div id="bal">${simBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <span className={`mono ${simBalance >= simStartBalance ? "up" : "dn"}`}>
                    {simBalance >= simStartBalance ? "+" : ""}
                    {(((simBalance - simStartBalance) / simStartBalance) * 100).toFixed(2)}% since baseline
                  </span>
                </div>
                <span className={`pill ${simFrozen ? "fz" : ""}`}>{simFrozen ? "FROZEN" : "ACTIVE"}</span>
              </div>
              <div className="cbox">
                <canvas id="c3" ref={c3Ref} role="img" aria-label="Vault balance chart" />
              </div>
              <div className="mrow mono">
                <span className="dim">LOSS LIMIT USED</span>
                <b>
                  {Math.min(100, Math.max(0, ((simStartBalance - simBalance) / simStartBalance / (lossLimitPct / 100)) * 100)).toFixed(0)}%
                </b>
              </div>
              <div className="meter">
                <i
                  style={{
                    width: `${
                      100 -
                      Math.min(100, Math.max(0, ((simStartBalance - simBalance) / simStartBalance / (lossLimitPct / 100)) * 100))
                    }%`,
                  }}
                />
              </div>
              <div className="row">
                <button
                  className="btn s"
                  type="button"
                  onClick={() => {
                    const next = !simRunning;
                    setSimRunning(next);
                    if (next) {
                      runTradeAttempt({ pair: "HSK/USDT", pct: 6, slip: 25, label: "swap 6% HSK/USDT @25bps" });
                    }
                  }}
                >
                  {simRunning ? "❚❚ Pause agent" : "▶ Run agent"}
                </button>
                <button
                  className="btn s k"
                  type="button"
                  onClick={() => runTradeAttempt({ kind: "wd", pair: "HSK/USDT", pct: 100, slip: 0, label: "withdraw(all) → 0xBAD...f00" })}
                >
                  Rogue: drain vault
                </button>
                <button
                  className="btn s k"
                  type="button"
                  onClick={() => runTradeAttempt({ pair: "HSK/USDT", pct: 90, slip: 20, label: "swap 90% HSK/USDT" })}
                >
                  Rogue: 90% trade
                </button>
                <button
                  className="btn s k"
                  type="button"
                  onClick={() => runTradeAttempt({ pair: "PEPE/USDT", pct: 5, slip: 20, label: "swap 5% PEPE/USDT" })}
                >
                  Rogue: unlisted token
                </button>
                {simFrozen && (
                  <button className="btn s" type="button" onClick={handleUnfreeze}>
                    Owner: unfreeze
                  </button>
                )}
              </div>
              <div className="log mono" role="log" aria-live="polite">
                {simLogs.map((l, i) => (
                  <div key={i} className={l.type}>
                    <b>{l.tag}</b>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 5: TALK TO IT (Dark Section, Chat with Gemini Copilot)       */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark blob" id="chat">
        <div className="wrap two">
          <div>
            <span className="mono tag rv">03 / Talk to it</span>
            <h2 className="split h" style={{ fontSize: "clamp(2.4rem, 5vw, 4.8rem)" }}>
              Conversation proposes. You confirm.
            </h2>
            <p className="lead rv">
              The agent turns your text into a typed rule-change card. Nothing takes effect until you sign, and conversational AI can never move or withdraw funds. Confirm a card and watch the mandate update.
            </p>
          </div>
          <div className="card rv">
            <div className="msgs">
              {chatMessages.map((m, i) => (
                <React.Fragment key={i}>
                  <div className={`m ${m.sender}`}>{m.text}</div>
                  {m.card && (
                    <div className="rc">
                      <b className="mono pl">RULE CHANGE · {m.card.title}</b>
                      <p>{m.card.desc}</p>
                      <div className="row">
                        <button
                          className="btn s"
                          type="button"
                          onClick={() => {
                            m.card?.onConfirm();
                            setChatMessages((prev) => [
                              ...prev,
                              { sender: "bot", text: "✓ Confirmed. Policy proposal registered for on-chain execution." },
                            ]);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn s k"
                          type="button"
                          onClick={() => {
                            setChatMessages((prev) => [
                              ...prev,
                              { sender: "bot", text: "✕ Proposal rejected. Mandate unchanged." },
                            ]);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {m.blocked && (
                    <div className="rc x">
                      <b className="mono dn">BLOCKED. Zero execution path for agent withdrawals.</b>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="chips">
              {[
                { t: "Cap my daily loss at 2%", text: "Cap my daily loss limit at 2%" },
                { t: "Add PEPE/USDT to my pairs", text: "Allow PEPE/USDT trading" },
                { t: "Send everything to 0x9aF...c21", text: "Send everything to 0x9aF...c21" },
              ].map((chip) => (
                <button
                  key={chip.t}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setChatInput(chip.text);
                  }}
                >
                  {chip.t}
                </button>
              ))}
            </div>
            <form className="frm" onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Try: cap my daily loss at 2%"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoComplete="off"
                aria-label="Message the agent"
              />
              <button className="btn s">Send</button>
            </form>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 6: SPREAD HUNTING (Light Section with Two-Pool Chart)       */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec light dots" id="spread">
        <div className="wrap">
          <span className="mono tag rv">04 / Spread hunting</span>
          <h2 className="split h">Where two pools disagree, the agent listens.</h2>
          <div className="two" style={{ marginTop: 56 }}>
            <div>
              <p className="lead rv" style={{ marginTop: 0 }}>
                The white line is Pool A and the yellow line is Pool B on Uniswap V3. When the gap clears trading fees plus slippage, the agent executes an arbitrage cycle. The vault verifies the net profit on-chain before finalizing.
              </p>
              <div className="feed">
                {spreadFeed.map((item, i) => (
                  <div key={i}>{item}</div>
                ))}
              </div>
            </div>
            <div className="chartcard rv">
              <div className="hh2">
                <span className="mono">
                  <i className="dot w" />
                  Pool A (0.3%)
                  <i className="dot y" />
                  Pool B (0.05%)
                </span>
                <span className="mono">
                  Spread <b className="up">{spreadBps} bps</b>
                </span>
              </div>
              <canvas id="c2" ref={c2Ref} role="img" aria-label="Arbitrage spread chart" />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 7: WHY CHOOSE US (Dark Section with Comparison & Manifesto)  */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark" id="why">
        <div className="wrap">
          <span className="mono tag rv">05 / Why choose us</span>
          <h2 className="split h">One of a kind: trust made optional.</h2>
          <div className="cmp">
            <div className="hd rv">
              <span>&nbsp;</span>
              <span>Typical AI trading bots</span>
              <span>HashPilot</span>
            </div>
            <div className="rv">
              <span>Can the agent withdraw funds?</span>
              <span>Often, via hot wallets or backend API keys</span>
              <span>Never. The smart contract has zero withdrawal path for the agent.</span>
            </div>
            <div className="rv">
              <span>Who enforces the rules?</span>
              <span>Backend server code or LLM system prompt</span>
              <span>Bytecode on HashKey Chain Mainnet</span>
            </div>
            <div className="rv">
              <span>AI error or prompt injection</span>
              <span>The rogue trade executes</span>
              <span>Out-of-mandate actions immediately revert</span>
            </div>
            <div className="rv">
              <span>Backend compromised</span>
              <span>Total principal drained</span>
              <span>Attacker is trapped inside your daily loss limit</span>
            </div>
            <div className="rv">
              <span>Loss protection</span>
              <span>Soft Telegram alerts, manual stops</span>
              <span>Hard on-chain circuit breaker freezes the vault</span>
            </div>
            <div className="rv">
              <span>Conversational commands</span>
              <span>May execute directly</span>
              <span>Only drafts EIP-712 cards you sign</span>
            </div>
          </div>
          <p className="mani" id="mani">
            <span>Other</span> <span>bots</span> <span>ask</span> <span>you</span> <span>to</span> <span>trust</span> <span>the</span> <span>AI.</span> <span>We</span> <span>made</span> <span>trust</span> <span className="pp">unnecessary.</span>
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 8: WHY HASHKEY CHAIN (Purple Section with Block Stream)     */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec purple" id="hashkey">
        <div className="wrap">
          <span className="mono tag rv">06 / Why HashKey Chain</span>
          <h2 className="split h">The right chain for a bounded agent.</h2>
          <div className="chainbox rv">
            <span className="mono">LIVE HASHKEY CHAIN BLOCK STREAM</span>
            <canvas id="c4" ref={c4Ref} aria-hidden="true" />
          </div>
          <div className="g4">
            <div className="card rv">
              <span className="mono">01</span>
              <h3>EVM-native</h3>
              <p>Solidity vaults, standard MetaMask wallets, and full EIP-712 support. The mandate is readable, auditable code.</p>
            </div>
            <div className="card rv" style={{ ["--d" as string]: ".08s" }}>
              <span className="mono">02</span>
              <h3>Compliance-minded ecosystem</h3>
              <p>Backed by HashKey Group, known for regulated digital-asset infrastructure. Built for capital that demands real guardrails.</p>
            </div>
            <div className="card rv" style={{ ["--d" as string]: ".16s" }}>
              <span className="mono">03</span>
              <h3>Built for frequent trades</h3>
              <p>Spread capture relies on speed and sub-cent gas costs. Low transaction fees keep small, repeated arbitrage cycles profitable.</p>
            </div>
            <div className="card rv" style={{ ["--d" as string]: ".24s" }}>
              <span className="mono">04</span>
              <h3>Liquidity at home</h3>
              <p>Uniswap V3 pools live on the exact same chain as the vault. Checks and swaps execute in the same block without bridges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 9: DOCUMENTATION (Light Section with Tabs)                  */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec light" id="docs">
        <div className="wrap">
          <span className="mono tag rv">07 / Documentation</span>
          <h2 className="split h">Docs, straight to the point.</h2>
          <div className="docs rv">
            <div id="dn">
              {[
                { id: "intro", title: "Introduction" },
                { id: "start", title: "Quickstart" },
                { id: "mandate", title: "Mandate reference" },
                { id: "breaker", title: "Circuit breaker" },
                { id: "chat", title: "Chat and voice" },
                { id: "security", title: "Security model" },
                { id: "faq", title: "FAQ" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeDocTab === tab.id ? "on" : ""}
                  onClick={() => setActiveDocTab(tab.id as typeof activeDocTab)}
                >
                  {tab.title}
                </button>
              ))}
            </div>
            <div id="dc">
              {activeDocTab === "intro" && (
                <>
                  <h3>What is HashPilot?</h3>
                  <p>
                    HashPilot is a non-custodial trading vault on HashKey Chain. An autonomous AI agent hunts arbitrage and price-spread opportunities across Uniswap V3 pools (USDT, WHSK, WETH, WBTC) and executes them for you, but strictly inside an on-chain <b>mandate</b> enforced by your vault&apos;s smart contract.
                  </p>
                  <h3>Core terms</h3>
                  <ul>
                    <li><b>Vault:</b> your personal smart contract. Only your owner wallet can withdraw or unfreeze.</li>
                    <li><b>Mandate:</b> immutable constraints on trade size, allowed tokens, slippage, and daily loss floors.</li>
                    <li><b>Agent:</b> an automated process holding a trade-only key. It proposes swap calldata and cannot withdraw.</li>
                    <li><b>Circuit breaker:</b> an automatic halt that freezes the agent when losses reach your limit.</li>
                  </ul>
                </>
              )}

              {activeDocTab === "start" && (
                <>
                  <h3>From zero to trading</h3>
                  <ol>
                    <li>Connect your MetaMask wallet to HashKey Chain Mainnet (Chain ID 177).</li>
                    <li>Deploy your vault through the interactive onboarding page.</li>
                    <li>Set your mandate parameters or pick a preset: Conservative, Balanced, or Active.</li>
                    <li>Deposit USDT capital into the vault smart contract.</li>
                    <li>Run the autonomous background worker (npm run agent) and monitor live execution.</li>
                  </ol>
                  <h3>Example preset configuration</h3>
                  <div className="code">
                    <button
                      className="copy"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`preset: balanced\nmax_position_usdt: 5.0\ndaily_loss_limit_pct: 5\nmax_slippage_bps: 50\nallowed_tokens:\n  - WHSK\n  - WETH\n  - WBTC`);
                        setCopyFeedback("Copied!");
                        setTimeout(() => setCopyFeedback(""), 1600);
                      }}
                    >
                      {copyFeedback || "Copy"}
                    </button>
                    <pre>
                      <code>
                        <span className="c"># HashPilot Mainnet Preset</span>
                        {"\n"}preset: balanced{"\n"}max_position_usdt: 5.0{"\n"}daily_loss_limit_pct: 5{"\n"}max_slippage_bps: 50{"\n"}allowed_tokens:{"\n"}  - WHSK{"\n"}  - WETH{"\n"}  - WBTC
                      </code>
                    </pre>
                  </div>
                </>
              )}

              {activeDocTab === "mandate" && (
                <>
                  <h3>Parameters (Smart Contract Specification)</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>PARAMETER</th>
                        <th>ON-CHAIN BEHAVIOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>maxPositionSize</code></td>
                        <td>Maximum USDT deployed in a single swap cycle</td>
                      </tr>
                      <tr>
                        <td><code>maxDailyVolume</code></td>
                        <td>24-hour cumulative turnover cap to prevent churn</td>
                      </tr>
                      <tr>
                        <td><code>maxDrawdownBps</code></td>
                        <td>Drawdown limit from high-water mark that halts the agent</td>
                      </tr>
                      <tr>
                        <td><code>maxSlippageBps</code></td>
                        <td>Worst acceptable execution price impact per hop</td>
                      </tr>
                      <tr>
                        <td><code>allowedTokens</code></td>
                        <td>Whitelist of token addresses the vault may swap</td>
                      </tr>
                      <tr>
                        <td><code>approvalThreshold</code></td>
                        <td>Trade size above which an offline EIP-712 signature is required</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {activeDocTab === "breaker" && (
                <>
                  <h3>How the circuit breaker works</h3>
                  <p>
                    The vault contract tracks its balance against a high-water mark. When realized loss reaches <code>maxDrawdownBps</code>, the contract sets <code>frozen = true</code> and rejects any further agent transactions.
                  </p>
                  <ul>
                    <li>Enforced in bytecode by the contract, not on an off-chain server.</li>
                    <li>Funds remain 100% withdrawable by the owner wallet at all times.</li>
                    <li>Only the owner wallet can unfreeze the vault, resetting the high-water mark.</li>
                  </ul>
                </>
              )}

              {activeDocTab === "chat" && (
                <>
                  <h3>Conversation proposes, you confirm</h3>
                  <p>
                    Natural language queries are interpreted by Google Gemini and transformed into strictly typed policy diffs. The agent has zero authority to execute changes directly.
                  </p>
                  <table>
                    <thead>
                      <tr>
                        <th>COPILOT CAN</th>
                        <th>COPILOT CANNOT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Draft a mandate modification card</td>
                        <td>Withdraw or transfer vault funds</td>
                      </tr>
                      <tr>
                        <td>Explain trade cycles and net profit</td>
                        <td>Loosen risk constraints without owner signature</td>
                      </tr>
                      <tr>
                        <td>Propose an instant pause</td>
                        <td>Unfreeze a tripped circuit breaker</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {activeDocTab === "security" && (
                <>
                  <h3>Threat Model & Security Invariants</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>THREAT</th>
                        <th>CONTRACT DEFENSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Agent makes an unprofitable swap</td>
                        <td>ProfitRequired: executeArbitrage reverts if final balance &lt; initial</td>
                      </tr>
                      <tr>
                        <td>Prompt injection / jailbreak</td>
                        <td>The contract ignores LLM intent and validates only bytecode invariants</td>
                      </tr>
                      <tr>
                        <td>Agent private key compromised</td>
                        <td>Attacker cannot withdraw funds; capped by daily volume and position size</td>
                      </tr>
                      <tr>
                        <td>DEX liquidity manipulation</td>
                        <td>Max slippage rule caps negative execution price impact</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {activeDocTab === "faq" && (
                <>
                  <h3>Frequently Asked Questions</h3>
                  <details>
                    <summary>Can the agent withdraw my funds?</summary>
                    <p>No. The HashPilot smart contract contains no transfer or withdrawal function callable by the agent address.</p>
                  </details>
                  <details>
                    <summary>Can I lose money?</summary>
                    <p>Trading always carries market risk. HashPilot guarantees profit-or-revert on arbitrage cycles and caps your daily drawdown with a hard circuit breaker.</p>
                  </details>
                  <details>
                    <summary>Which tokens are supported?</summary>
                    <p>The vault operates with USDT as the base stablecoin and trades against WHSK, WETH, and WBTC on Uniswap V3.</p>
                  </details>
                  <details>
                    <summary>Which network does this run on?</summary>
                    <p>HashKey Chain Mainnet (Chain ID 177) and Testnet (Chain ID 133).</p>
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION 10: EARLY ACCESS / ONBOARDING BOT (Dark Section)            */}
      {/* -------------------------------------------------------------------- */}
      <section className="sec dark" id="join">
        <div className="wrap two">
          <div>
            <span className="mono tag rv">08 / Early access</span>
            <h2 className="split h" style={{ fontSize: "clamp(2.4rem, 5vw, 4.8rem)" }}>
              Meet the onboarding agent.
            </h2>
            <p className="lead rv">
              No endless paperwork. Answer four quick questions and the onboarding agent prepares your vault contract configuration.
            </p>
            <ul className="checks rv">
              <li>We never ask for a private key or seed phrase</li>
              <li>Your owner wallet retains full non-custodial control</li>
              <li>Ready to deploy in under 60 seconds</li>
            </ul>
          </div>
          <div className="card rv">
            <div className="prog">
              <i style={{ width: `${((regStep + 1) / 5) * 100}%` }} />
            </div>
            <div className="msgs">
              {regMessages.map((m, i) => (
                <div key={i} className={`m ${m.sender}`}>
                  {m.text}
                  {m.options && (
                    <div className="chips mt-3">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className="chip"
                          onClick={() => {
                            setRegData((d) => ({ ...d, preset: opt }));
                            setRegMessages((prev) => [
                              ...prev,
                              { sender: "me", text: opt },
                              { sender: "bot", text: `Selected ${opt}. Configuration complete! Click below to deploy.` },
                            ]);
                            setRegStep(4);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {regStep >= 4 ? (
              <div className="mt-4">
                <Link href="/onboarding" className="btn w-full">
                  Deploy Vault on HashKey Chain
                </Link>
              </div>
            ) : (
              <form className="frm" onSubmit={handleRegSubmit}>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={regInput}
                  onChange={(e) => setRegInput(e.target.value)}
                  autoComplete="off"
                  aria-label="Your answer"
                />
                <button className="btn s">Send</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* GRAND FOOTER (Purple Section with Controls & Large Wordmark)         */}
      {/* -------------------------------------------------------------------- */}
      <footer className="landing-footer">
        <div className="wrap">
          <div className="cta">
            Put a leash on your agent. <em>Not on your upside.</em>
          </div>
          <form
            className="wl"
            onSubmit={(e) => {
              e.preventDefault();
              setWaitlistSuccess(true);
              setWaitlistEmail("");
            }}
          >
            <input
              type="email"
              placeholder="you@email.com"
              required
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              aria-label="Email address"
            />
            <button className="btn">Join the waitlist</button>
          </form>
          {waitlistSuccess && (
            <p className="mono text-emerald-400 mt-3">✓ You are registered for the next vault cohort.</p>
          )}

          <div className="fg">
            <div>
              <span className="mono">PRODUCT</span>
              <Link href="/dashboard">Vault Dashboard</Link>
              <Link href="/policy">Mandate Governance</Link>
              <Link href="/chat">AI Copilot</Link>
              <Link href="/opportunities">Arbitrage Scanner</Link>
            </div>
            <div>
              <span className="mono">NETWORK</span>
              <a href="https://hashkey.blockscout.com" target="_blank" rel="noreferrer">
                HashKey Explorer
              </a>
              <a href="https://mainnet.hsk.xyz" target="_blank" rel="noreferrer">
                RPC Endpoint
              </a>
              <a href="#docs">Security Audits</a>
            </div>
            <div>
              <span className="mono">SETTINGS</span>
              <label className="sw">
                <input
                  type="checkbox"
                  checked={motionOn}
                  onChange={(e) => setMotionOn(e.target.checked)}
                />
                <i />
                Animations
              </label>
              <label className="sw">
                <input
                  type="checkbox"
                  checked={feedOn}
                  onChange={(e) => setFeedOn(e.target.checked)}
                />
                <i />
                Live chart feed
              </label>
              <label className="sw">
                <input
                  type="checkbox"
                  checked={glowOn}
                  onChange={(e) => setGlowOn(e.target.checked)}
                />
                <i />
                Cursor glow
              </label>
            </div>
          </div>
        </div>
        <div className="big" aria-hidden="true">
          HASHPILOT
        </div>
        <p className="fine">
          Trading digital assets involves market risk, including potential loss of principal. HashPilot smart contracts enforce mathematical loss floors and programmatic invariants on HashKey Chain. © 2026 HashPilot.
        </p>
      </footer>
    </div>
  );
}
