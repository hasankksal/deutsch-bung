"use client";

import { useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { speakGerman } from "@/lib/speech";
import { Icon } from "./icons";

export function cn(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "sketch jitter-hover bg-marker text-ink hover:bg-[#f9d968] disabled:opacity-50",
  secondary: "sketch jitter-hover bg-sheet text-ink hover:bg-white disabled:opacity-50",
  ghost: "rounded-lg text-graphite hover:bg-ink/5 hover:text-ink disabled:opacity-50",
  danger: "sketch text-red-pencil [--line:var(--color-red-pencil)] hover:bg-wash-red",
};

const SIZES = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return (
    <button
      type="button"
      className={cn(
        "hand-bold inline-flex -rotate-[0.6deg] items-center justify-center gap-1.5 transition hover:rotate-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:cursor-not-allowed",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const TONES: Record<Tone, string> = {
  neutral: "bg-ink/5 text-graphite",
  accent: "bg-ink text-sheet",
  success: "bg-wash-green text-green-pencil [--line:var(--color-green-pencil)]",
  warning: "bg-marker-soft text-ink",
  danger: "bg-wash-red text-red-pencil [--line:var(--color-red-pencil)]",
};

export function Chip({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("sketch sketch-thin sketch-once inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("sketch bg-sheet p-5 sm:p-6", className)}>{children}</div>;
}

/** Small section label, written like a quick pen note. */
export const LABEL = "font-note text-[1.1rem] font-bold leading-tight text-graphite";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  kind = "radio",
  className,
}: {
  /** null while nothing is selected yet (before the saved choice is loaded) */
  value: T | null;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (value: T) => void;
  label: string;
  kind?: "radio" | "tab";
  className?: string;
}) {
  return (
    <div role={kind === "radio" ? "radiogroup" : "tablist"} aria-label={label} className={cn("inline-flex flex-wrap gap-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role={kind}
            aria-checked={kind === "radio" ? active : undefined}
            aria-selected={kind === "tab" ? active : undefined}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "hand-bold px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ink",
              active ? "sketch sketch-round bg-marker-soft text-ink" : "rounded-lg text-graphite hover:bg-ink/5 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    />
  );
}

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => speakGerman(text)}
      aria-label="Sesli dinle"
      title="Sesli dinle"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-pencil transition-colors hover:bg-ink/5 hover:text-ink",
        className,
      )}
    >
      <Icon name="volume" />
    </button>
  );
}

export function StarButton({
  active,
  onToggle,
  label,
  onDark = false,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  /** Placed on the dark slot machine body */
  onDark?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        "hover:bg-ink/5",
        active ? "text-marker [&_svg]:stroke-ink" : onDark ? "text-graphite hover:text-ink" : "text-pencil hover:text-ink",
        className,
      )}
    >
      <Icon name="star" filled={active} className="size-[18px]" />
    </button>
  );
}

export function ProgressBar({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: "accent" | "success";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("sketch sketch-thin sketch-once h-2.5 w-full overflow-hidden", className)}>
      <div
        className={cn("hatch h-full transition-[width] duration-500", tone === "success" ? "bg-green-pencil/60" : "bg-marker")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// A shared clock ticking every 30 s. Reading it never calls Date.now() during render,
// so prerendering stays deterministic (the server snapshot is 0).
let nowValue = typeof window === "undefined" ? 0 : Date.now();
const nowListeners = new Set<() => void>();
let nowTimer: number | undefined;

function subscribeNow(listener: () => void) {
  nowListeners.add(listener);
  nowValue = Date.now();
  nowTimer ??= window.setInterval(() => {
    nowValue = Date.now();
    nowListeners.forEach((l) => l());
  }, 30_000);
  return () => {
    nowListeners.delete(listener);
    if (!nowListeners.size && nowTimer !== undefined) {
      window.clearInterval(nowTimer);
      nowTimer = undefined;
    }
  };
}

/** Current time in ms (0 during server render), refreshed every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribeNow,
    () => nowValue,
    () => 0,
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeMotion(listener: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

/** True when the visitor asked the system for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
