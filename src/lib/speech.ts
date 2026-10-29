/** Reads German text aloud with the browser's built-in voices (free, works offline on most systems). */
export function speakGerman(text: string, { rate = 0.95, onEnd }: { rate?: number; onEnd?: () => void } = {}): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("de"));
  if (voice) utterance.voice = voice;
  if (onEnd) utterance.onend = onEnd;
  synth.cancel();
  synth.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
