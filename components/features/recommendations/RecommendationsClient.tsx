"use client";

import Link from "next/link";
import * as recoConfig from "@/lib/reco/config";
import { ScheduleWatchModal } from "@/components/features/recommendations/ScheduleWatchModal";
import { RecommendationsLoadingState } from "@/components/features/recommendations/RecommendationsLoadingState";
import { useRecommendationBuilder } from "@/hooks/useRecommendationBuilder";
import { RecommendationsMoodStep } from "@/components/features/recommendations/RecommendationsMoodStep";
import { RecommendationsRefineStep } from "@/components/features/recommendations/RecommendationsRefineStep";
import { RecommendationsResults } from "@/components/features/recommendations/RecommendationsResults";

const FEELING_OPTIONS = Array.isArray(recoConfig.FEELING_OPTIONS)
  ? recoConfig.FEELING_OPTIONS
  : [];

const INTENTION_OPTIONS = Array.isArray(recoConfig.INTENTION_OPTIONS)
  ? recoConfig.INTENTION_OPTIONS
  : [];

const ENERGY_OPTIONS = Array.isArray(recoConfig.ENERGY_OPTIONS)
  ? recoConfig.ENERGY_OPTIONS
  : [];

const PACE_OPTIONS = Array.isArray(recoConfig.PACE_OPTIONS)
  ? recoConfig.PACE_OPTIONS
  : [];

const INTENSITY_OPTIONS = Array.isArray(recoConfig.INTENSITY_OPTIONS)
  ? recoConfig.INTENSITY_OPTIONS
  : [];

const DARKNESS_OPTIONS = Array.isArray(recoConfig.DARKNESS_OPTIONS)
  ? recoConfig.DARKNESS_OPTIONS
  : [];

const BRAINPOWER_OPTIONS = Array.isArray(recoConfig.BRAINPOWER_OPTIONS)
  ? recoConfig.BRAINPOWER_OPTIONS
  : [];

const CONTEXT_OPTIONS = Array.isArray(recoConfig.CONTEXT_OPTIONS)
  ? recoConfig.CONTEXT_OPTIONS
  : [];

const RUNTIME_OPTIONS = Array.isArray(recoConfig.RUNTIME_OPTIONS)
  ? recoConfig.RUNTIME_OPTIONS
  : [];

const PROVIDER_OPTIONS = Array.isArray(recoConfig.PROVIDER_OPTIONS)
  ? recoConfig.PROVIDER_OPTIONS
  : [];

const QUICK_PRESETS = Array.isArray(recoConfig.QUICK_PRESETS)
  ? recoConfig.QUICK_PRESETS
  : [];

export default function RecommendationsClient() {
  const builder = useRecommendationBuilder();

  if (builder.loading) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Recommendations
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (!builder.user) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="mx-auto max-w-4xl border-2 border-black bg-[var(--surface)]">
          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Recommendations
              </p>
              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Sign in to get recommendations.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Feelix builds suggestions from your mood, your filters, and your saved taste.
              </p>
            </div>

            <div className="grid gap-2 min-[420px]:grid-cols-2 md:grid-cols-1">
              <Link className="btn btn-primary text-center" href="/login?from=/recommendations">
                Sign In
              </Link>
              <Link className="btn btn-ghost text-center" href="/signup">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8 sm:py-10">
      <div className="grid gap-6">
        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="grid border-b-2 border-black sm:grid-cols-3">
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              Mood-first discovery
            </div>
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              Personal taste
            </div>
            <div className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Filtered picks
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Recommendation builder
              </p>
              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Find a film for how you feel.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Start with a quick mood, refine the kind of night you want, and let Feelix return a
                best match with strong alternatives.
              </p>
            </div>

            <Link href="/" className="btn btn-ghost text-center md:w-auto">
              Back Home
            </Link>
          </div>
        </section>

        {builder.err ? (
          <div className="border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
            {builder.err}
          </div>
        ) : null}

        {builder.saveMsg ? (
          <div className="border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
            {builder.saveMsg}
          </div>
        ) : null}

        {builder.busy && builder.step !== 2 ? <RecommendationsLoadingState /> : null}

        {!builder.busy && builder.step === 0 ? (
          <RecommendationsMoodStep
            quickPresets={QUICK_PRESETS}
            feelingOptions={FEELING_OPTIONS}
            selectedPresetKey={builder.selectedPresetKey}
            feelings={builder.feelings}
            railRef={builder.railRef}
            applyPreset={builder.applyPreset}
            slidePresets={builder.slidePresets}
            toggleFeeling={builder.toggleFeeling}
            onContinue={() => builder.setStep(1)}
          />
        ) : null}

        {!builder.busy && builder.step === 1 ? (
          <RecommendationsRefineStep
            summary={builder.summary}
            intentions={builder.intentions}
            intentionOptions={INTENTION_OPTIONS}
            toggleIntention={builder.toggleIntention}
            watchContext={builder.watchContext}
            contextOptions={CONTEXT_OPTIONS}
            setWatchContextValue={builder.setWatchContextValue}
            energy={builder.energy}
            energyOptions={ENERGY_OPTIONS}
            setEnergyValue={builder.setEnergyValue}
            pace={builder.pace}
            paceOptions={PACE_OPTIONS}
            setPaceValue={builder.setPaceValue}
            intensity={builder.intensity}
            intensityOptions={INTENSITY_OPTIONS}
            setIntensityValue={builder.setIntensityValue}
            darkness={builder.darkness}
            darknessOptions={DARKNESS_OPTIONS}
            setDarknessValue={builder.setDarknessValue}
            brainpower={builder.brainpower}
            brainpowerOptions={BRAINPOWER_OPTIONS}
            setBrainpowerValue={builder.setBrainpowerValue}
            providerIds={builder.providerIds}
            providerOptions={PROVIDER_OPTIONS}
            toggleProvider={builder.toggleProvider}
            maxRuntime={builder.maxRuntime}
            runtimeOptions={RUNTIME_OPTIONS}
            setMaxRuntimeValue={builder.setMaxRuntimeValue}
            minRating={builder.minRating}
            maxRating={builder.maxRating}
            setMinRatingValue={builder.setMinRatingValue}
            setMaxRatingValue={builder.setMaxRatingValue}
            surpriseMe={builder.surpriseMe}
            setSurpriseMeValue={builder.setSurpriseMeValue}
            canRecommend={builder.canRecommend}
            busy={builder.busy}
            onBack={() => builder.setStep(0)}
            onRecommend={() => builder.recommend()}
          />
        ) : null}

        {builder.step === 2 ? (
          <RecommendationsResults
            summary={builder.summary}
            items={builder.items}
            busy={builder.busy}
            onChangeMood={() => builder.setStep(1)}
            onTryAnother={() => builder.recommend(Date.now() + 1)}
            addToWatchlist={builder.addToWatchlist}
            openSchedule={builder.openSchedule}
          />
        ) : null}
      </div>

      <ScheduleWatchModal
        open={builder.scheduleOpen}
        userId={builder.user.id}
        movie={builder.scheduleItem}
        onClose={() => builder.setScheduleOpen(false)}
        onSaved={(msg) => builder.setSavedMessage(msg)}
      />
    </section>
  );
}