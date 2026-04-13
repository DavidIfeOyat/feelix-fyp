"use client";

import { useEffect, useMemo, useState } from "react";

const ROTATING_MESSAGES = [
  "Reading your mood profile...",
  "Matching tone, pace, and intensity...",
  "Checking filters and provider options...",
  "Ranking the strongest film matches...",
  "Preparing your final recommendation set...",
] as const;

function LoadingStage({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`border-2 px-4 py-4 transition ${
        complete
          ? "border-black bg-black text-[var(--background)]"
          : active
          ? "border-black bg-[var(--surface-strong)] text-[var(--foreground)]"
          : "border-black bg-[var(--surface)] text-[var(--muted)]"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] sm:text-[10px]">
        {complete ? "Done" : active ? "Working" : "Pending"}
      </p>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.06em] sm:text-base">
        {label}
      </p>
    </div>
  );
}

export function RecommendationsLoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % ROTATING_MESSAGES.length);
    }, 1700);

    const elapsedTimer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(elapsedTimer);
    };
  }, []);

  const activeMessage = ROTATING_MESSAGES[messageIndex];

  const stageState = useMemo(() => {
    if (elapsedSeconds < 2) {
      return { current: 0, completed: -1 };
    }
    if (elapsedSeconds < 4) {
      return { current: 1, completed: 0 };
    }
    return { current: 2, completed: 1 };
  }, [elapsedSeconds]);

  return (
    <section className="mt-8 border-2 border-black bg-[var(--surface)]">
      <div className="grid border-b-2 border-black sm:grid-cols-3">
        <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
          Recommendation engine
        </div>
        <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
          Personal taste signals
        </div>
        <div className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
          Final ranking
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
            Finding your films
          </p>

          <h2 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
            Building your recommendation set.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Feelix is combining your mood, viewing context, filters, and saved taste signals to
            return the strongest match and close alternatives.
          </p>

          <div className="mt-5 border-2 border-black bg-[var(--surface-strong)] px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              Live status
            </p>
            <p className="mt-2 text-base font-bold uppercase tracking-[0.02em] text-[var(--foreground)] sm:text-lg">
              {activeMessage}
            </p>
            <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
              This can take a few seconds while the app scores and filters candidate films.
            </p>
          </div>

          <div className="mt-5">
            <div className="h-3 overflow-hidden border-2 border-black bg-[var(--surface)]">
              <div className="loading-bar h-full" />
            </div>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              {elapsedSeconds < 1 ? "Starting..." : `${elapsedSeconds}s elapsed`}
            </p>
          </div>
        </div>

        <div className="grid gap-3 self-start">
          <LoadingStage
            label="Read mood and context"
            active={stageState.current === 0}
            complete={stageState.completed >= 0}
          />
          <LoadingStage
            label="Apply filters and scoring"
            active={stageState.current === 1}
            complete={stageState.completed >= 1}
          />
          <LoadingStage
            label="Prepare final picks"
            active={stageState.current === 2}
            complete={false}
          />
        </div>
      </div>
    </section>
  );
}