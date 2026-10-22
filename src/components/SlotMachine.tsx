"use client";

import { useLayoutEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { sfx } from "@/lib/sound";
import { Reels } from "./Reels";
import { cn, useReducedMotion } from "./ui";

export type MachineState = "idle" | "busy" | "correct" | "almost" | "incorrect";

const BULBS = 18;

function Lights({ mode }: { mode: "spin" | MachineState }) {
  return (
    <div className="lights relative flex justify-between px-4 pt-1 pb-3" data-mode={mode} aria-hidden="true">
      {Array.from({ length: BULBS }, (_, i) => (
        <span key={i} className="bulb" style={{ "--i": i } as CSSProperties} />
      ))}
    </div>
  );
}

/** Amber digits on the machine, like the credit display of a slot machine. */
export function Led({ label, value, title, className }: { label: string; value: string; title?: string; className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-1.5", className)} title={title}>
      <span className="font-note text-base text-graphite">{label}</span>
      <span className="inline-flex overflow-hidden">
        <span key={value} className="led inline-block animate-bump text-sm font-semibold">
          {value}
        </span>
      </span>
    </span>
  );
}

// ---------- lever ----------

/** Distance from the pivot to the centre of the knob, in px */
const ROD = 52;
const TRAVEL = ROD * 1.8;

function knobTransform(y: number): string {
  // the knob comes towards the viewer as it passes the pivot
  const scale = 1 + 0.22 * Math.max(0, 1 - Math.abs(y - ROD) / ROD);
  return `translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
}

function rodTransform(y: number): string {
  return `scaleY(${(1 - y / ROD).toFixed(3)})`;
}

type Point = { o: number; y: number; e?: string };

const PULL: Point[] = [
  { o: 0, y: 0, e: "cubic-bezier(.55,0,.85,.4)" },
  { o: 0.15, y: ROD, e: "cubic-bezier(.15,.5,.5,1)" },
  { o: 0.25, y: TRAVEL },
  { o: 0.34, y: TRAVEL, e: "cubic-bezier(.5,0,.85,.45)" },
  { o: 0.56, y: ROD, e: "cubic-bezier(.2,.6,.4,1)" },
  { o: 0.82, y: -5, e: "ease-in-out" },
  { o: 1, y: 0 },
];

function play(knob: HTMLElement | null, rod: HTMLElement | null, points: Point[], duration: number): Animation[] {
  if (!knob || !rod) return [];
  const frames = (fn: (y: number) => string): Keyframe[] =>
    points.map((p) => ({ offset: p.o, transform: fn(p.y), ...(p.e ? { easing: p.e } : {}) }));
  return [knob.animate(frames(knobTransform), { duration }), rod.animate(frames(rodTransform), { duration })];
}

function Lever({ spinKey, onPull, disabled }: { spinKey: string; onPull: () => void; disabled?: boolean }) {
  const reduced = useReducedMotion();
  const knob = useRef<HTMLSpanElement>(null);
  const rod = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ start: number; y: number } | null>(null);
  const quietUntil = useRef(0);

  // Every new sentence pulls the lever, also when it came from a button or the keyboard.
  // After a pull by hand the lever is already on its way back, so that one is skipped.
  useLayoutEffect(() => {
    if (reduced || performance.now() < quietUntil.current) return;
    const anims = play(knob.current, rod.current, PULL, 1000);
    sfx.lever();
    return () => anims.forEach((a) => a.cancel());
  }, [spinKey, reduced]);

  function place(y: number) {
    if (knob.current) knob.current.style.transform = y ? knobTransform(y) : "";
    if (rod.current) rod.current.style.transform = y ? rodTransform(y) : "";
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (disabled || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    knob.current?.getAnimations().forEach((a) => a.cancel());
    rod.current?.getAnimations().forEach((a) => a.cancel());
    drag.current = { start: e.clientY, y: 0 };
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    d.y = Math.max(0, Math.min(TRAVEL, e.clientY - d.start));
    place(d.y);
  }

  function release(pull: boolean) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    place(0);
    if (d.y < 6) {
      // a tap: the whole pull plays when the new sentence arrives
      if (pull) onPull();
      return;
    }
    play(
      knob.current,
      rod.current,
      [
        { o: 0, y: d.y, e: "cubic-bezier(.2,.6,.4,1)" },
        { o: 0.7, y: -5, e: "ease-in-out" },
        { o: 1, y: 0 },
      ],
      520,
    );
    if (pull && d.y > ROD) {
      quietUntil.current = performance.now() + 800;
      sfx.lever();
      onPull();
    }
  }

  return (
    <button
      type="button"
      aria-label="Kolu çek: yeni cümle"
      title="Kolu çek: yeni cümle"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => release(true)}
      onPointerCancel={() => release(false)}
      onClick={(e) => {
        // keyboard (Enter / Space); pointer presses are handled above
        if (e.detail === 0) onPull();
      }}
      className="group relative w-9 shrink-0 cursor-grab touch-none outline-none select-none active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 sm:w-12"
    >
      <span className="lever-mount absolute top-1/2 left-0 h-4 w-1/2 -translate-y-1/2" />
      <span className="absolute top-1/2 left-1/2 size-0">
        <span
          ref={rod}
          className="rod absolute bottom-0 -left-[2.5px] w-[5px] origin-bottom rounded-full"
          style={{ height: ROD }}
        />
        <span className="pivot absolute -top-[7px] -left-[7px] size-[14px]" />
        <span
          ref={knob}
          className="knob absolute -left-[15px] size-[30px] transition-[translate] group-hover:translate-y-0.5 group-focus-visible:outline-2 group-focus-visible:outline-ink"
          style={{ top: -ROD - 15 }}
        />
      </span>
    </button>
  );
}

// ---------- machine ----------

export function SlotMachine({
  text,
  spinKey,
  state,
  header,
  aside,
  onPull,
  pullDisabled,
  size = "lg",
}: {
  text: string;
  /** A new key spins the reels (and pulls the lever) */
  spinKey: string;
  state: MachineState;
  header: ReactNode;
  aside?: ReactNode;
  onPull?: () => void;
  pullDisabled?: boolean;
  size?: "lg" | "md";
}) {
  return (
    <div className="flex items-stretch">
      <div className="machine sketch sketch-bold jitter min-w-0 flex-1 p-2.5 sm:p-3">
        <span className="machine-shade" aria-hidden="true" />
        <div className="relative flex min-h-10 items-center gap-3 pr-1 pl-3">
          <div className="min-w-0 flex-1">{header}</div>
          {aside && <div className="flex shrink-0 items-center gap-3">{aside}</div>}
        </div>
        <Lights key={`${spinKey}:${state}`} mode={state === "idle" ? "spin" : state} />
        <div
          className={cn(
            "reel-window sketch sketch-bold px-6 sm:px-10",
            size === "lg" ? "py-9 sm:py-11" : "py-6 sm:py-8",
            state === "incorrect" && "animate-shake",
          )}
          data-state={state}
        >
          <span className="drum" aria-hidden="true" />
          <span className="payline" aria-hidden="true" />
          <p
            lang="tr"
            className={cn(
              "hand-bold relative text-center",
              size === "lg" ? "text-[1.6rem] sm:text-[2.1rem]" : "text-xl sm:text-2xl",
            )}
            style={{ lineHeight: 1.25 }}
          >
            <Reels text={text} spinKey={spinKey} />
          </p>
        </div>
      </div>
      {onPull && <Lever spinKey={spinKey} onPull={onPull} disabled={pullDisabled} />}
    </div>
  );
}

// ---------- celebration ----------

const COINS = Array.from({ length: 16 }, (_, i) => {
  const angle = (-160 + (140 * i) / 15) * (Math.PI / 180);
  const dist = 90 + ((i * 37) % 70);
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist * 0.9),
    r: (i * 67) % 360,
    d: (i * 29) % 160,
  };
});

/** Gold coins bursting out of the centre of the parent (which must be positioned). */
export function CoinBurst({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10", className)}>
      {COINS.map((c, i) => (
        <span
          key={i}
          className="coin"
          style={{ "--x": `${c.x}px`, "--y": `${c.y}px`, "--r": `${c.r}deg`, "--d": `${c.d}ms` } as CSSProperties}
        />
      ))}
    </span>
  );
}
