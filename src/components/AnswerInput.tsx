"use client";

import { useEffect, useRef } from "react";
import { cn } from "./ui";

const SPECIAL_CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"];

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  autoFocus,
  focusKey,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Focus again whenever this changes (a new sentence in the same box) */
  focusKey?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // preventScroll: the sentence above the box must stay in view
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus, focusKey]);

  const insert = (ch: string) => {
    const el = ref.current;
    if (!el) {
      onChange(value + ch);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <div
      className={cn(
        "sketch lined bg-sheet transition-colors",
        invalid ? "[--line:var(--color-red-pencil)]" : "focus-within:[--line:var(--color-blue-pencil)]",
        disabled && "bg-paper/70",
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        rows={2}
        lang="de"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="sentences"
        aria-label="Almanca çevirin"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        placeholder="Almancasını yaz, Enter'a bas"
        className="block w-full resize-none bg-transparent pt-[0.55rem] pr-5 pb-0 pl-12 text-xl leading-[2.25rem] text-ink outline-none placeholder:text-lg placeholder:text-pencil disabled:text-graphite"
      />
      {!disabled && (
        <div className="flex flex-wrap gap-1.5 pt-1 pr-4 pb-3 pl-12" aria-label="Özel harfler">
          {SPECIAL_CHARS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => insert(ch)}
              className="sketch sketch-thin sketch-once h-7 min-w-7 bg-paper px-1.5 text-sm font-semibold text-graphite transition-colors hover:bg-marker-soft hover:text-ink"
              aria-label={`${ch} harfini ekle`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
