import type { Metadata } from "next";
import { DictationView } from "@/components/dictation/DictationView";

export const metadata: Metadata = { title: "Dinle & Yaz · Almanca Pratik" };

export default function Page() {
  return <DictationView />;
}
