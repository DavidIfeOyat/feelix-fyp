"use client";

import type {
  Brainpower,
  Darkness,
  Energy,
  Intensity,
  Pace,
  WatchContext,
} from "@/lib/reco/config";

type Option<T extends string> = { value: T; label: string };
type RuntimeOption = { value: number; label: string };
type ProviderOption = { id: number; label: string };

export type RecommendationsRefineStepProps = {
  summary: string;
  intentions: string[];
  intentionOptions: readonly { value: string; label: string }[];
  toggleIntention: (value: string) => void;
  watchContext: WatchContext;
  contextOptions: readonly Option<WatchContext>[];
  setWatchContextValue: (value: WatchContext) => void;
  energy: Energy;
  energyOptions: readonly Option<Energy>[];
  setEnergyValue: (value: Energy) => void;
  pace: Pace;
  paceOptions: readonly Option<Pace>[];
  setPaceValue: (value: Pace) => void;
  intensity: Intensity;
  intensityOptions: readonly Option<Intensity>[];
  setIntensityValue: (value: Intensity) => void;
  darkness: Darkness;
  darknessOptions: readonly Option<Darkness>[];
  setDarknessValue: (value: Darkness) => void;
  brainpower: Brainpower;
  brainpowerOptions: readonly Option<Brainpower>[];
  setBrainpowerValue: (value: Brainpower) => void;
  providerIds: number[];
  providerOptions: readonly ProviderOption[];
  toggleProvider: (id: number) => void;
  maxRuntime: number;
  runtimeOptions: readonly RuntimeOption[];
  setMaxRuntimeValue: (value: number) => void;
  minRating: number;
  maxRating: number;
  setMinRatingValue: (value: number) => void;
  setMaxRatingValue: (value: number) => void;
  surpriseMe: boolean;
  setSurpriseMeValue: (value: boolean) => void;
  canRecommend: boolean;
  busy: boolean;
  onBack: () => void;
  onRecommend: () => void;
};

function selectChipClass(selected: boolean) {
  return `select-chip ${selected ? "is-selected" : ""}`;
}

type ChoiceGroupProps<T extends string> = {
  title: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-2 border-black bg-[var(--surface)]">
      <div className="border-b-2 border-black px-4 py-3 sm:px-5">
        {eyebrow ? (
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">
          {title}
        </h2>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ChoiceGroup<T extends string>({
  title,
  value,
  options,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <section className="border-2 border-black bg-[var(--surface)]">
      <div className="border-b border-black px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          {title}
        </p>
      </div>

      <div className="p-4">
        <div className="select-grid cols-2 sm:cols-3 gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              className={selectChipClass(value === option.value)}
              onClick={() => onChange(option.value)}
              type="button"
              aria-pressed={value === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecommendationsRefineStep({
  summary,
  intentions,
  intentionOptions,
  toggleIntention,
  watchContext,
  contextOptions,
  setWatchContextValue,
  energy,
  energyOptions,
  setEnergyValue,
  pace,
  paceOptions,
  setPaceValue,
  intensity,
  intensityOptions,
  setIntensityValue,
  darkness,
  darknessOptions,
  setDarknessValue,
  brainpower,
  brainpowerOptions,
  setBrainpowerValue,
  providerIds,
  providerOptions,
  toggleProvider,
  maxRuntime,
  runtimeOptions,
  setMaxRuntimeValue,
  minRating,
  maxRating,
  setMinRatingValue,
  setMaxRatingValue,
  surpriseMe,
  setSurpriseMeValue,
  canRecommend,
  busy,
  onBack,
  onRecommend,
}: RecommendationsRefineStepProps) {
  return (
    <div className="mt-8 grid gap-6">
      <Panel eyebrow="Current vibe" title="Your mood summary">
        <p className="text-sm leading-7 text-[var(--foreground)]">{summary}</p>
      </Panel>

      <Panel eyebrow="Intent" title="What do you want tonight?">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Pick 1 intention to keep the recommendation focused.
          </p>
          <div className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            {intentions.length}/1
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {intentionOptions.map((intention) => {
            const active = intentions.includes(intention.value);

            return (
              <button
                key={intention.value}
                className={selectChipClass(active)}
                onClick={() => toggleIntention(intention.value)}
                type="button"
                aria-pressed={active}
              >
                {intention.label}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel eyebrow="Context" title="Who are you watching with?">
        <div className="select-grid cols-2 mt-1 gap-3">
          {contextOptions.map((option) => (
            <button
              key={option.value}
              className={selectChipClass(watchContext === option.value)}
              onClick={() => setWatchContextValue(option.value)}
              type="button"
              aria-pressed={watchContext === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Panel>

      <details className="overflow-hidden border-2 border-black bg-[var(--surface)]" open>
        <summary className="cursor-pointer list-none border-b-2 border-black px-4 py-4 sm:px-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Refine search
            </p>
            <h2 className="mt-2 text-xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">
              Adjust the details
            </h2>
          </div>
        </summary>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
          <ChoiceGroup
            title="Energy"
            value={energy}
            options={energyOptions}
            onChange={setEnergyValue}
          />

          <ChoiceGroup
            title="Pace"
            value={pace}
            options={paceOptions}
            onChange={setPaceValue}
          />

          <ChoiceGroup
            title="Intensity"
            value={intensity}
            options={intensityOptions}
            onChange={setIntensityValue}
          />

          <ChoiceGroup
            title="Tone darkness"
            value={darkness}
            options={darknessOptions}
            onChange={setDarknessValue}
          />

          <ChoiceGroup
            title="Brainpower"
            value={brainpower}
            options={brainpowerOptions}
            onChange={setBrainpowerValue}
          />

          <section className="border-2 border-black bg-[var(--surface)]">
            <div className="border-b border-black px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Streaming services
              </p>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {providerOptions.map((provider) => {
                  const active = providerIds.includes(provider.id);

                  return (
                    <button
                      key={provider.id}
                      className={selectChipClass(active)}
                      onClick={() => toggleProvider(provider.id)}
                      type="button"
                      aria-pressed={active}
                    >
                      {provider.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-black pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Maximum runtime
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  {runtimeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={selectChipClass(maxRuntime === option.value)}
                      onClick={() => setMaxRuntimeValue(option.value)}
                      type="button"
                      aria-pressed={maxRuntime === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-2 border-black bg-[var(--surface)] lg:col-span-2">
            <div className="border-b border-black px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Rating range
              </p>
            </div>

            <div className="p-4">
              <div className="flex justify-between gap-4 text-sm text-[var(--foreground)]">
                <span>Min: {minRating.toFixed(1)}</span>
                <span>Max: {maxRating.toFixed(1)}</span>
              </div>

              <div className="mt-4 grid gap-4">
                <input
                  className="slider"
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minRating}
                  onChange={(e) =>
                    setMinRatingValue(Math.min(Number(e.target.value), maxRating))
                  }
                />

                <input
                  className="slider"
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={maxRating}
                  onChange={(e) =>
                    setMaxRatingValue(Math.max(Number(e.target.value), minRating))
                  }
                />
              </div>

              <label className="mt-5 grid grid-cols-[auto_1fr] gap-3 border-2 border-black bg-[var(--surface-strong)] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={surpriseMe}
                  onChange={(e) => setSurpriseMeValue(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-black"
                />
                <span className="leading-6 text-[var(--foreground)]">
                  Surprise me with a looser, more exploratory search.
                </span>
              </label>

              <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
                You need at least one feeling or one intention before getting recommendations.
              </p>
            </div>
          </section>
        </div>
      </details>

      <div className="grid gap-2 min-[420px]:grid-cols-2 sm:w-fit sm:min-w-[320px]">
        <button className="btn btn-ghost" onClick={onBack} disabled={busy} type="button">
          Back
        </button>

        <button
          className="btn btn-primary"
          onClick={onRecommend}
          disabled={!canRecommend || busy}
          type="button"
        >
          {busy ? "Finding..." : "Get Recommendations"}
        </button>
      </div>
    </div>
  );
}