import { Suspense } from "react";
import FilmsExplorer from "@/components/features/films/FilmsExplorer";

function FilmsExplorerFallback() {
  return (
    <section className="container py-6 sm:py-8 md:py-10">
      <div className="border-2 border-black bg-[var(--surface)]">
        <div className="border-b-2 border-black px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Film explorer
          </p>
          <h1 className="mt-3 text-4xl font-extrabold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl md:text-6xl">
            Browse the collection.
          </h1>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)]">Loading films...</p>
        </div>
      </div>
    </section>
  );
}

export default function FilmsPage() {
  return (
    <Suspense fallback={<FilmsExplorerFallback />}>
      <FilmsExplorer />
    </Suspense>
  );
}