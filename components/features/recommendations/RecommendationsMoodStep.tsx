"use client";

import type { CSSProperties, RefObject } from "react";
import * as recoConfig from "@/lib/reco/config";
import type { QuickPreset } from "@/lib/reco/config";

type FeelingOption = { value: string; label: string };

export type RecommendationsMoodStepProps = {
  quickPresets: readonly QuickPreset[];
  feelingOptions: readonly FeelingOption[];
  selectedPresetKey: string | null;
  feelings: string[];
  railRef: RefObject<HTMLDivElement | null>;
  applyPreset: (preset: QuickPreset) => void;
  slidePresets: (direction: "prev" | "next") => void;
  toggleFeeling: (value: string) => void;
  onContinue: () => void;
};

const getFeelingTone =
  typeof recoConfig.getFeelingTone === "function"
    ? recoConfig.getFeelingTone
    : () => ({
        bg: "rgba(255,255,255,0.08)",
        border: "rgba(255,255,255,0.16)",
        text: "#edf3fb",
        glow: "0 18px 44px rgba(0,0,0,0.14)",
      });

function labelFromValue(
  value: string,
  source: ReadonlyArray<{ value: string; label: string }>
) {
  return source.find((item) => item.value === value)?.label ?? value;
}

function feelingToneStyle(value: string): CSSProperties {
  const tone = getFeelingTone(value);

  return {
    ["--emotion-bg" as string]: tone.bg,
    ["--emotion-border" as string]: tone.border,
    ["--emotion-text" as string]: tone.text,
    ["--emotion-glow" as string]: tone.glow,
  };
}

function presetBackground(image: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(4,10,18,0.04) 0%, rgba(4,10,18,0.28) 36%, rgba(4,10,18,0.90) 100%), url(${image})`,
  };
}

function selectChipClass(selected: boolean, tone = false) {
  return `select-chip ${tone ? "select-chip--tone" : ""} ${selected ? "is-selected" : ""}`;
}

export function RecommendationsMoodStep({
  quickPresets,
  feelingOptions,
  selectedPresetKey,
  feelings,
  railRef,
  applyPreset,
  slidePresets,
  toggleFeeling,
  onContinue,
}: RecommendationsMoodStepProps) {
  const canContinue = Boolean(selectedPresetKey) || feelings.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    onContinue();
  }

  return (
    <div className="mt-8 grid gap-6 sm:gap-8">
      <div className="surface overflow-hidden rounded-[--radius-xl] p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Quick starts</h2>
            <p className="mt-1 text-sm text-[--color-muted]">
              Pick a preset if you want the fastest route to a recommendation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 self-start md:flex md:self-auto">
            <button
              className="btn btn-ghost"
              onClick={() => slidePresets("prev")}
              type="button"
              aria-label="Previous preset"
            >
              ←
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => slidePresets("next")}
              type="button"
              aria-label="Next preset"
            >
              →
            </button>
          </div>
        </div>

        <div ref={railRef} className="preset-rail mt-5">
          {quickPresets.map((preset) => {
            const isActive = selectedPresetKey === preset.key;

            return (
              <button
                key={preset.key}
                className={`preset-card ${isActive ? "is-active" : ""}`}
                onClick={() => applyPreset(preset)}
                style={presetBackground(preset.image)}
                type="button"
                aria-pressed={isActive}
              >
                <div className="preset-card__content">
                  <span className="glass-badge">Quick start</span>

                  <div>
                    <div className="text-2xl font-black tracking-tight text-white">
                      {preset.label}
                    </div>
                    <p className="mt-2 max-w-sm text-sm text-white">
                      {preset.description}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {preset.feelings.map((feeling) => (
                      <span
                        key={`${preset.key}-${feeling}`}
                        className="glass-badge glass-badge--soft"
                      >
                        {labelFromValue(feeling, feelingOptions)}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface rounded-[--radius-xl] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">How are you feeling right now?</h2>
            <p className="mt-1 text-sm text-[--color-muted]">
              Pick up to 2 feelings so this stays quick and easy.
            </p>
          </div>

          <div className="text-xs text-[--color-muted]">{feelings.length}/2 selected</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {feelingOptions.map((feeling) => {
            const active = feelings.includes(feeling.value);

            return (
              <button
                key={feeling.value}
                className={selectChipClass(active, true)}
                onClick={() => toggleFeeling(feeling.value)}
                style={feelingToneStyle(feeling.value)}
                type="button"
                aria-pressed={active}
              >
                {feeling.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mobile-stack">
        {!canContinue ? (
          <p className="text-sm text-[--color-muted]">
            Select a quick preset or at least one feeling to continue.
          </p>
        ) : null}

        <button
          className="btn btn-primary"
          onClick={handleContinue}
          type="button"
          disabled={!canContinue}
          aria-disabled={!canContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}