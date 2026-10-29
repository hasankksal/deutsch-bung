"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setSound, useAppState, useHydrated } from "@/lib/store";
import { Icon } from "./icons";
import { cn, useNow } from "./ui";

const NAV = [
  { href: "/", label: "Pratik" },
  { href: "/dinle", label: "Dinle" },
  { href: "/defter", label: "Defterim" },
  { href: "/ilerleme", label: "İlerleme" },
];

/** A tiny slot machine doodled in pencil: three reels and a lever. */
function Logo() {
  return (
    <svg viewBox="0 0 34 30" aria-hidden="true" className="pencil-icon h-8 w-9 shrink-0 -rotate-3">
      <path d="M3.5 4.2 C 10 3.4, 18 3.9, 26.3 3.6 C 26.9 10, 26.6 18, 26.9 26.4 C 19 26.9, 10 26.2, 3.2 26.7 C 2.9 19, 3.4 11, 3.5 4.2 Z" className="fill-sheet stroke-ink" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6.6 9.1 h4.6 v11.4 h-4.6 z M12.6 8.8 h4.6 v11.7 h-4.6 z M18.6 9.2 h4.6 v11.2 h-4.6 z" className="fill-marker stroke-ink" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.4 14.9 C 12 14.3, 18 15.4, 24.6 14.7" fill="none" className="stroke-red-pencil" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26.9 17.5 C 29.5 17.2, 30.4 13, 30.1 7.6" fill="none" className="stroke-ink" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="30.2" cy="6.1" r="2.4" className="fill-red-pencil stroke-ink" strokeWidth="1.2" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const state = useAppState();
  const hydrated = useHydrated();
  const now = useNow();
  const dueWords = hydrated ? state.words.filter((w) => w.due <= now).length : 0;
  const sound = hydrated ? state.sound : true;

  return (
    <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Almanca Pratik, ana sayfa">
          <Logo />
          <span className="hand-bold hidden text-lg sm:inline">Almanca Pratik</span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5 sm:ml-4" aria-label="Ana menü">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-[15px] transition-colors sm:px-3",
                  active ? "hand-bold text-ink" : "text-graphite hover:text-ink",
                )}
              >
                {item.label}
                {item.href === "/defter" && dueWords > 0 && (
                  <span className="sketch sketch-thin sketch-once sketch-round ml-1.5 bg-marker px-1.5 text-[11px] font-bold text-ink">{dueWords}</span>
                )}
                {active && <span aria-hidden="true" className="scribble absolute inset-x-2 -bottom-1 h-2 sm:inset-x-2.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:ml-auto">
          <button
            type="button"
            onClick={() => setSound(!sound)}
            aria-pressed={sound}
            aria-label={sound ? "Sesleri kapat" : "Sesleri aç"}
            title={sound ? "Sesleri kapat" : "Sesleri aç"}
            className="inline-flex size-9 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Icon name={sound ? "volume" : "volumeOff"} className="size-[18px]" />
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="rule-line mx-auto w-[min(100%_-_2rem,42rem)]" />
    </header>
  );
}
