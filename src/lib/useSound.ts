"use client";

import { useCallback, useRef } from "react";

type SoundKind = "click" | "success" | "error" | "notify" | "pop";

// Generates short, pleasant beeps on the fly instead of shipping .mp3 files.
// Respects users who have low-power or reduced-motion-style preferences by
// staying tiny (a few oscillator nodes) and silent unless triggered.
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  const play = useCallback((kind: SoundKind = "click") => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes: Record<SoundKind, { freqs: number[]; dur: number; type: OscillatorType }> = {
      click: { freqs: [720], dur: 0.06, type: "sine" },
      pop: { freqs: [500, 780], dur: 0.09, type: "sine" },
      success: { freqs: [523, 659, 784], dur: 0.14, type: "sine" },
      error: { freqs: [220, 160], dur: 0.18, type: "sawtooth" },
      notify: { freqs: [660, 880], dur: 0.12, type: "triangle" },
    };
    const { freqs, dur, type } = notes[kind];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const start = now + i * (dur * 0.8);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }, []);

  return play;
}
