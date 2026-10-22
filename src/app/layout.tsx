import type { Metadata } from "next";
import { Caveat, Shantell_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { SketchFilters } from "@/components/SketchFilters";
import "./globals.css";

/** Handwriting with "informal" and "bounce" axes: letters that never sit perfectly on the line. */
const hand = Shantell_Sans({ subsets: ["latin", "latin-ext"], axes: ["BNCE", "INFM"], variable: "--font-shantell" });
/** Quick pen notes for labels and counters. */
const note = Caveat({ subsets: ["latin", "latin-ext"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Almanca Pratik",
  description: "Türkçe cümleleri Almancaya çevir, hatalarının nedenini öğren, benzer cümlelerle pekiştir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${hand.variable} ${note.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SketchFilters />
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-10 sm:pt-8">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 pb-8 text-center font-note text-lg text-pencil">
          İlerlemen ve yıldızların sadece bu tarayıcıda saklanır.
        </footer>
      </body>
    </html>
  );
}
