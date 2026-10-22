"use client";

import { useId, type ReactNode } from "react";
import type { Exercise, GradeResult, VocabItem } from "@/lib/types";
import { AnswerInput } from "./AnswerInput";
import { Icon } from "./icons";
import { ResultView, VocabList } from "./ResultView";
import { SlotMachine, type MachineState } from "./SlotMachine";
import { Button, cn, Spinner, StarButton } from "./ui";

export interface Slot {
  /** Unique per showing: a new key spins the reels */
  key: string;
  exercise: Exercise;
  answer: string;
  status: "answering" | "grading" | "graded";
  result: GradeResult | null;
  /** 0 none, 1 vocabulary, 2 structure hint, 3 answer revealed */
  hints: number;
  inputError: string | null;
}

let slotSeq = 0;

export function newSlot(exercise: Exercise): Slot {
  slotSeq += 1;
  return {
    key: `${exercise.id}#${slotSeq}`,
    exercise,
    answer: "",
    status: "answering",
    result: null,
    hints: 0,
    inputError: null,
  };
}

function machineState(slot: Slot): MachineState {
  if (slot.status === "grading") return "busy";
  if (slot.status === "graded" && slot.result) return slot.result.verdict;
  return "idle";
}

const HINT_LABELS = ["İpucu: kelimeler", "İpucu: yapı", "Cevabı göster"];

export function ExercisePanel({
  slot,
  header,
  counters,
  size = "lg",
  onPull,
  sentenceStarred,
  onToggleSentence,
  starredWords,
  onToggleWord,
  onChange,
  onSubmit,
  onHint,
  onSkip,
  autoFocus,
}: {
  slot: Slot;
  /** Left side of the machine's top panel */
  header: ReactNode;
  /** Displays next to the star on the machine */
  counters?: ReactNode;
  size?: "lg" | "md";
  /** Shows the lever */
  onPull?: () => void;
  sentenceStarred: boolean;
  onToggleSentence: () => void;
  starredWords: Set<string>;
  onToggleWord: (v: VocabItem) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHint: () => void;
  onSkip?: () => void;
  autoFocus?: boolean;
}) {
  const errorId = useId();
  const { exercise, status } = slot;
  const answering = status === "answering";

  return (
    <div>
      <SlotMachine
        text={exercise.tr}
        spinKey={slot.key}
        state={machineState(slot)}
        header={header}
        aside={
          <>
            {counters}
            <StarButton
              onDark
              active={sentenceStarred}
              onToggle={onToggleSentence}
              label={sentenceStarred ? "Cümlenin yıldızını kaldır" : "Cümleyi yıldızla"}
            />
          </>
        }
        onPull={onPull}
        pullDisabled={status === "grading"}
        size={size}
      />

      <div className={cn("mt-4", onPull && "sm:mr-12")}>
        <AnswerInput
          value={slot.answer}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={!answering}
          autoFocus={autoFocus}
          focusKey={slot.key}
          invalid={Boolean(slot.inputError)}
          describedBy={slot.inputError ? errorId : undefined}
        />
        {slot.inputError && (
          <p id={errorId} className="mt-2 px-1 font-note text-lg text-red-pencil">
            {slot.inputError}
          </p>
        )}

        {slot.hints > 0 && answering && (
          <div className="sketch sketch-thin mt-3 animate-rise space-y-3 bg-sheet/80 p-4">
            {exercise.vocab.length > 0 ? (
              <VocabList vocab={exercise.vocab} starred={starredWords} onToggle={onToggleWord} />
            ) : (
              <p className="text-sm text-graphite">Bu cümle için kelime ipucu yok.</p>
            )}
            {slot.hints >= 2 && exercise.hint && (
              <p className="flex gap-2 text-sm text-graphite">
                <Icon name="help" className="mt-0.5 size-4 shrink-0 text-red-pencil" />
                {exercise.hint}
              </p>
            )}
            {slot.hints >= 3 && (
              <p className="text-sm">
                <span lang="de" className="marker hand-bold px-1">
                  {exercise.de[0]}
                </span>
                <span className="mt-1 block text-xs text-graphite">
                  Cevabı gördün; şimdi kendin yaz. Bu deneme doğru sayılmaz, cümle tekrar listene eklenir.
                </span>
              </p>
            )}
          </div>
        )}

        {status !== "graded" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="lg" onClick={onSubmit} disabled={status === "grading"}>
              {status === "grading" ? <Spinner /> : <Icon name="check" />}
              {status === "grading" ? "Bakılıyor…" : "Kontrol et"}
            </Button>
            {slot.hints < 3 && (
              <Button variant="ghost" size="lg" onClick={onHint} disabled={status === "grading"}>
                <Icon name="help" />
                {HINT_LABELS[slot.hints]}
              </Button>
            )}
            {onSkip && (
              <Button variant="ghost" size="lg" onClick={onSkip} disabled={status === "grading"} className="ml-auto">
                <Icon name="skip" />
                Geç
              </Button>
            )}
          </div>
        )}

        {status === "graded" && slot.result && (
          <ResultView
            exercise={exercise}
            answer={slot.answer}
            result={slot.result}
            starredWords={starredWords}
            onToggleWord={onToggleWord}
          />
        )}
      </div>
    </div>
  );
}
