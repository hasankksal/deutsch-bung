"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildReels, REEL_LAND, REEL_LINE } from "@/lib/reels";
import { sfx } from "@/lib/sound";
import { useReducedMotion } from "./ui";

/** A sentence that lands word by word, like slot machine reels, whenever `spinKey` changes. */
export function Reels({ text, spinKey }: { text: string; spinKey: string }) {
  const reduced = useReducedMotion();
  const id = `${spinKey}|${text}`;
  const [settled, setSettled] = useState<string | null>(null);
  const reels = useMemo(() => buildReels(text, id), [text, id]);
  const spinning = !reduced && settled !== id && reels.length > 0;
  const strips = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    if (!spinning) return;
    const anims = reels.map((r, i) => {
      const to = -r.strip.length * REEL_LINE;
      return strips.current[i]?.animate(
        [
          { offset: 0, transform: "translateY(0)", filter: "blur(0px)", easing: "ease-out" },
          { offset: 0.07, transform: "translateY(0.2em)", easing: "cubic-bezier(.45,0,.2,1)" },
          { offset: 0.2, filter: "blur(1.5px)" },
          { offset: 0.66, filter: "blur(1.5px)" },
          { offset: REEL_LAND, transform: `translateY(${to - 0.22}em)`, filter: "blur(0px)", easing: "ease-in-out" },
          { offset: 1, transform: `translateY(${to}em)`, filter: "blur(0px)" },
        ],
        { duration: r.duration },
      );
    });
    const last = anims[anims.length - 1];
    if (last) last.onfinish = () => setSettled(id);
    const silence = sfx.spin(reels.map((r) => r.duration * REEL_LAND));
    return () => {
      anims.forEach((a) => a?.cancel());
      silence();
    };
  }, [id, reels, spinning]);

  if (!spinning) return <>{text}</>;

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {reels.map((r, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="reel">
              <span className="reel-sizer">{r.word}</span>
              <span
                ref={(el) => {
                  strips.current[i] = el;
                }}
                className="reel-strip"
                style={{ transform: `translateY(${-r.strip.length * REEL_LINE}em)` }}
              >
                {r.strip.map((w, k) => (
                  <span key={k}>{w}</span>
                ))}
                <span>{r.word}</span>
                <span>{r.after}</span>
              </span>
            </span>
          </Fragment>
        ))}
      </span>
    </>
  );
}
