// Turkish meanings for lines that have none, from the free MyMemory translation service.
// Lines are translated one at a time as they come up and kept in the browser, so a chorus or a
// repeated line is only ever asked for once.

const API = "https://api.mymemory.translated.net/get";

const inFlight = new Map<string, Promise<string | null>>();
/** Lines the service could not translate this session; not asked again */
const failed = new Set<string>();
let quotaHit = false;

/** German → Turkish. Resolves to null when the service is unreachable or out of free quota. */
export function translateToTurkish(text: string): Promise<string | null> {
  const key = text.trim();
  if (!key || quotaHit || failed.has(key)) return Promise.resolve(null);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const p = (async () => {
    try {
      const res = await fetch(`${API}?langpair=de|tr&q=${encodeURIComponent(key.slice(0, 480))}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { responseStatus?: number | string; quotaFinished?: boolean; responseData?: { translatedText?: string } };
      if (data.quotaFinished) quotaHit = true;
      const out = data.responseData?.translatedText?.trim();
      if (Number(data.responseStatus) !== 200 || !out || /MYMEMORY WARNING/i.test(out)) {
        failed.add(key);
        return null;
      }
      return out;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, p);
  return p;
}
