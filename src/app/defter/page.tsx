import type { Metadata } from "next";
import { NotebookView } from "@/components/NotebookView";

export const metadata: Metadata = { title: "Defterim · Almanca Pratik" };

export default function Page() {
  return <NotebookView />;
}
