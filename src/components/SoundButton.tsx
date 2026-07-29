"use client";

import { ButtonHTMLAttributes } from "react";
import { useSound } from "@/lib/useSound";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-sky text-white hover:bg-sky-deep shadow-pop hover:shadow-none active:scale-[0.98]",
  secondary:
    "bg-amber text-white hover:bg-amber-burnt shadow-pop hover:shadow-none active:scale-[0.98]",
  ghost:
    "bg-white text-ink border border-ink/15 hover:border-sky hover:text-sky active:scale-[0.98]",
  danger:
    "bg-white text-amber-burnt border border-amber-burnt/40 hover:bg-amber-burnt hover:text-white active:scale-[0.98]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  sound?: "click" | "success" | "error" | "notify" | "pop";
}

export default function SoundButton({
  variant = "primary",
  sound = "click",
  className = "",
  onClick,
  children,
  ...rest
}: Props) {
  const play = useSound();
  return (
    <button
      {...rest}
      onClick={(e) => {
        play(sound);
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
