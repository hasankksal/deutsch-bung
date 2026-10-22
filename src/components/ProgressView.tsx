"use client";

import { useRouter } from "next/navigation";
import { getTopic, levelLabel, topicName } from "@/lib/curriculum";
import { accuracy, correctStreak, streakDays, timeAgo, todayCount, topCategories } from "@/lib/stats";
import { DAILY_GOAL, resetAll, setLevelAndTopic, useAppState, useHydrated } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";
import { Icon } from "./icons";
import { Button, Card, Chip, cn, LABEL, ProgressBar, useNow } from "./ui";

/** One counter of the scoreboard (a dark panel like the slot machine). */
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="relative min-w-0 px-1">
      <p className="font-note text-lg text-graphite">{label}</p>
      <p className="led mt-1 text-4xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-graphite">{sub}</p>}
    </div>
  );
}

const VERDICT_MARK = {
  correct: { icon: "check", cls: "bg-wash-green text-green-pencil [--line:var(--color-green-pencil)]" },
  almost: { icon: "info", cls: "bg-marker-soft text-ink [--line:#b7791f]" },
  incorrect: { icon: "x", cls: "bg-wash-red text-red-pencil [--line:var(--color-red-pencil)]" },
} as const;

export function ProgressView() {
  const state = useAppState();
  const hydrated = useHydrated();
  const now = useNow();
  const router = useRouter();

  if (!hydrated) return <div className="sketch h-64 animate-pulse bg-ink/5" />;

  const acc = accuracy(state);
  const streak = streakDays(state, new Date(now));
  const run = correctStreak(state);
  const today = todayCount(state, new Date(now));
  const categories = topCategories(state);
  const maxCat = categories[0]?.count ?? 1;
  const topics = Object.entries(state.topicStats)
    .map(([id, s]) => ({ id, topic: getTopic(id), ...s, rate: s.attempts ? s.correct / s.attempts : 0 }))
    .filter((t) => t.topic)
    .sort((a, b) => a.rate - b.rate || b.attempts - a.attempts);
  const weakest = topics.find((t) => t.attempts >= 2 && t.rate < 0.7);

  function practice(topicId: string) {
    const topic = getTopic(topicId);
    if (!topic) return;
    setLevelAndTopic(topic.level, topic.id);
    router.push("/");
  }

  if (!state.attempts.length) {
    return (
      <div className="space-y-6">
        <h1 className="hand-bold wobble-text scribble inline-block text-4xl">İlerleme</h1>
        <Card>
          <p className="hand-bold">Henüz veri yok</p>
          <p className="mt-1 text-sm leading-relaxed text-graphite">
            Birkaç cümle çevirdiğinde burada en çok yaptığın hata türlerini, konulara göre başarını ve serini göreceksin.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => router.push("/")}>
            Pratiğe başla <Icon name="arrowRight" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="hand-bold wobble-text scribble inline-block text-4xl">İlerleme</h1>

      <div className="machine sketch sketch-bold grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5 sm:grid-cols-4">
        <span className="machine-shade" aria-hidden="true" />
        <Metric label="Toplam çeviri" value={String(state.attempts.length)} sub={`Bugün ${today}/${DAILY_GOAL}`} />
        <Metric label="Doğruluk" value={acc === null ? "–" : `%${acc}`} sub="tam doğru cevaplar" />
        <Metric
          label="Gün serisi"
          value={String(streak)}
          sub={run ? `şu an ${run} doğru üst üste` : streak ? "devam et" : "bugün başla"}
        />
        <Metric label="Yıldızlı kelime" value={String(state.words.length)} sub={`${state.review.length} cümle tekrarda`} />
      </div>

      {weakest?.topic && (
        <Card className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className={LABEL}>Önerilen çalışma</p>
            <p className="hand-bold mt-1">
              {levelLabel(weakest.topic.level)} · {weakest.topic.name}
            </p>
            <p className="text-sm text-graphite">
              Bu konuda başarın %{Math.round(weakest.rate * 100)}. Birkaç cümle daha çalışmak iyi gelir.
            </p>
          </div>
          <Button variant="primary" onClick={() => practice(weakest.id)}>
            Bu konuyu çalış <Icon name="arrowRight" />
          </Button>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className={cn(LABEL, "px-1")}>En çok yaptığın hatalar</h2>
        {categories.length === 0 ? (
          <p className="px-1 text-sm text-graphite">Kayıtlı hata yok. Harika gidiyorsun!</p>
        ) : (
          <Card className="space-y-3">
            {categories.map((c) => (
              <div key={c.category} className="grid grid-cols-[minmax(0,10rem)_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate">{CATEGORY_LABELS[c.category]}</span>
                <ProgressBar value={(100 * c.count) / maxCat} />
                <span className="text-right text-graphite tabular-nums">{c.count}</span>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className={cn(LABEL, "px-1")}>Konulara göre durum</h2>
        <ul className="sketch divide-y divide-dashed divide-ink/20 bg-sheet">
          {topics.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Chip tone="accent">{levelLabel(t.topic!.level)}</Chip>
                  <span className="truncate">{topicName(t.id)}</span>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={t.rate * 100} tone={t.rate >= 0.8 ? "success" : "accent"} className="max-w-48" />
                  <span className="text-xs text-graphite tabular-nums">
                    {t.correct}/{t.attempts} doğru
                    {t.followupTotal > 0 && ` · pekiştirme ${t.followupOk}/${t.followupTotal}`}
                  </span>
                </div>
              </div>
              <Button size="sm" onClick={() => practice(t.id)}>
                Çalış
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={cn(LABEL, "px-1")}>Son çeviriler</h2>
        <ul className="space-y-2">
          {state.attempts.slice(0, 12).map((a) => {
            const mark = VERDICT_MARK[a.verdict];
            return (
              <li
                key={a.id}
                className="sketch sketch-thin flex items-start gap-3 bg-sheet px-4 py-3 text-sm"
              >
                <span className={cn("sketch sketch-thin sketch-round mt-0.5 inline-flex size-7 shrink-0 items-center justify-center", mark.cls)}>
                  <Icon name={mark.icon} className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-graphite">{a.tr}</p>
                  <p lang="de" className="mt-0.5">
                    {a.answer}
                  </p>
                </div>
                <span className="shrink-0 font-note text-base text-pencil">
                  {a.isFollowup ? "pekiştirme · " : ""}
                  {timeAgo(a.at, now)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="border-t border-dashed border-ink/25 pt-4">
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm("Tüm ilerlemen, yıldızların ve tekrar listen silinecek. Emin misin?")) resetAll();
          }}
        >
          <Icon name="trash" /> Tüm verileri sıfırla
        </Button>
      </div>
    </div>
  );
}
