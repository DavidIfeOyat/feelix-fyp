export type Region = "GB" | "US";
export type DealType = "stream" | "rent" | "buy";

export type Energy = "low" | "medium" | "high";
export type Pace = "slow" | "balanced" | "fast";
export type Intensity = "light" | "balanced" | "intense";
export type Darkness = "light" | "mixed" | "dark";
export type Brainpower = "easy" | "engaging" | "deep";
export type WatchContext = "solo" | "date" | "friends" | "family";

export type FeelingTone = {
  bg: string;
  border: string;
  text: string;
  glow: string;
};

export const FEELING_OPTIONS = [
  {
    value: "relaxed",
    label: "Relaxed",
    tone: {
      bg: "rgba(168, 191, 162, 0.22)",
      border: "rgba(168, 191, 162, 0.58)",
      text: "#eef8ea",
      glow: "0 18px 44px rgba(168, 191, 162, 0.22)",
    },
  },
  {
    value: "stressed",
    label: "Stressed",
    tone: {
      bg: "rgba(183, 215, 242, 0.20)",
      border: "rgba(183, 215, 242, 0.56)",
      text: "#edf6ff",
      glow: "0 18px 44px rgba(183, 215, 242, 0.20)",
    },
  },
  {
    value: "tired",
    label: "Tired",
    tone: {
      bg: "rgba(244, 177, 131, 0.18)",
      border: "rgba(244, 177, 131, 0.54)",
      text: "#fff1e5",
      glow: "0 18px 44px rgba(244, 177, 131, 0.18)",
    },
  },
  {
    value: "excited",
    label: "Excited",
    tone: {
      bg: "rgba(240, 90, 40, 0.20)",
      border: "rgba(240, 90, 40, 0.58)",
      text: "#fff0ea",
      glow: "0 18px 44px rgba(240, 90, 40, 0.24)",
    },
  },
  {
    value: "curious",
    label: "Curious",
    tone: {
      bg: "rgba(247, 216, 74, 0.20)",
      border: "rgba(247, 216, 74, 0.56)",
      text: "#fffbe3",
      glow: "0 18px 44px rgba(247, 216, 74, 0.20)",
    },
  },
  {
    value: "romantic",
    label: "Romantic",
    tone: {
      bg: "rgba(201, 79, 124, 0.20)",
      border: "rgba(201, 79, 124, 0.56)",
      text: "#fff0f6",
      glow: "0 18px 44px rgba(201, 79, 124, 0.22)",
    },
  },
  {
    value: "reflective",
    label: "Reflective",
    tone: {
      bg: "rgba(62, 74, 137, 0.22)",
      border: "rgba(98, 113, 192, 0.54)",
      text: "#eef1ff",
      glow: "0 18px 44px rgba(62, 74, 137, 0.22)",
    },
  },
  {
    value: "hopeful",
    label: "Hopeful",
    tone: {
      bg: "rgba(185, 214, 92, 0.20)",
      border: "rgba(185, 214, 92, 0.56)",
      text: "#f7ffe7",
      glow: "0 18px 44px rgba(185, 214, 92, 0.20)",
    },
  },
  {
    value: "lonely",
    label: "Lonely",
    tone: {
      bg: "rgba(154, 144, 184, 0.20)",
      border: "rgba(154, 144, 184, 0.52)",
      text: "#f3f0ff",
      glow: "0 18px 44px rgba(154, 144, 184, 0.18)",
    },
  },
  {
    value: "playful",
    label: "Playful",
    tone: {
      bg: "rgba(217, 79, 184, 0.20)",
      border: "rgba(217, 79, 184, 0.56)",
      text: "#fff0fb",
      glow: "0 18px 44px rgba(217, 79, 184, 0.20)",
    },
  },
  {
    value: "bored",
    label: "Bored",
    tone: {
      bg: "rgba(212, 199, 181, 0.20)",
      border: "rgba(212, 199, 181, 0.52)",
      text: "#fff8ef",
      glow: "0 18px 44px rgba(212, 199, 181, 0.16)",
    },
  },
  {
    value: "overwhelmed",
    label: "Overwhelmed",
    tone: {
      bg: "rgba(47, 93, 80, 0.24)",
      border: "rgba(79, 137, 119, 0.56)",
      text: "#ecfff7",
      glow: "0 18px 44px rgba(47, 93, 80, 0.24)",
    },
  },
] as const;

export const INTENTION_OPTIONS = [
  { value: "comfort me", label: "Comfort me" },
  { value: "make me laugh", label: "Make me laugh" },
  { value: "keep me hooked", label: "Keep me hooked" },
  { value: "make me think", label: "Make me think" },
  { value: "help me escape", label: "Help me escape" },
  { value: "give me romance", label: "Give me romance" },
  { value: "give me adrenaline", label: "Give me adrenaline" },
  { value: "move me emotionally", label: "Move me emotionally" },
  { value: "surprise me", label: "Surprise me" },
  { value: "mind-bending", label: "Mind-bending" },
  { value: "heartwarming", label: "Heartwarming" },
  { value: "dark and gripping", label: "Dark and gripping" },
] as const;

export const ENERGY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export const PACE_OPTIONS = [
  { value: "slow", label: "Slow-burn" },
  { value: "balanced", label: "Balanced" },
  { value: "fast", label: "Fast-paced" },
] as const;

export const INTENSITY_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "balanced", label: "Balanced" },
  { value: "intense", label: "Intense" },
] as const;

export const DARKNESS_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "mixed", label: "Mixed" },
  { value: "dark", label: "Dark" },
] as const;

export const BRAINPOWER_OPTIONS = [
  { value: "easy", label: "Easy watch" },
  { value: "engaging", label: "Engaging" },
  { value: "deep", label: "Thought-provoking" },
] as const;

export const CONTEXT_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "date", label: "Date night" },
  { value: "friends", label: "With friends" },
  { value: "family", label: "Family" },
] as const;

export const RUNTIME_OPTIONS = [
  { value: 90, label: "90 min max" },
  { value: 120, label: "2 hours max" },
  { value: 150, label: "2.5 hours max" },
  { value: 240, label: "Any length" },
] as const;

export const PROVIDER_OPTIONS = [
  { label: "Netflix", id: 8 },
  { label: "Disney+", id: 337 },
  { label: "Prime", id: 9 },
  { label: "Apple TV", id: 2 },
] as const;

export type QuickPreset = {
  key: string;
  label: string;
  description: string;
  image: string;
  feelings: string[];
  intentions: string[];
  energy: Energy;
  pace: Pace;
  intensity: Intensity;
  darkness: Darkness;
  brainpower: Brainpower;
  watchContext: WatchContext;
};

export const QUICK_PRESETS: readonly QuickPreset[] = [
  {
    key: "cozy-cabin",
    label: "Cozy Cabin",
    description: "Soft, comforting, low-pressure picks.",
    image: "/presets/cozy-cabin.jpg",
    feelings: ["tired", "stressed"],
    intentions: ["comfort me", "heartwarming"],
    energy: "low",
    pace: "slow",
    intensity: "light",
    darkness: "light",
    brainpower: "easy",
    watchContext: "solo",
  },
  {
    key: "neon-dreams",
    label: "Neon Dreams",
    description: "Stylish, curious, high-energy exploration.",
    image: "/presets/neon-dreams.jpg",
    feelings: ["curious", "excited"],
    intentions: ["mind-bending", "help me escape"],
    energy: "high",
    pace: "fast",
    intensity: "balanced",
    darkness: "mixed",
    brainpower: "engaging",
    watchContext: "solo",
  },
  {
    key: "dark-pulse",
    label: "Dark Pulse",
    description: "Gritty, tense, gripping mood.",
    image: "/presets/dark-pulse.jpg",
    feelings: ["curious", "bored"],
    intentions: ["dark and gripping", "keep me hooked"],
    energy: "medium",
    pace: "balanced",
    intensity: "intense",
    darkness: "dark",
    brainpower: "engaging",
    watchContext: "solo",
  },
  {
    key: "sunday-comfort",
    label: "Sunday Comfort",
    description: "Warm, easy, feel-good choices.",
    image: "/presets/sunday-comfort.jpg",
    feelings: ["relaxed", "hopeful"],
    intentions: ["comfort me", "make me laugh"],
    energy: "low",
    pace: "slow",
    intensity: "light",
    darkness: "light",
    brainpower: "easy",
    watchContext: "family",
  },
  {
    key: "edge-of-seat",
    label: "Edge of Seat",
    description: "Fast, tense, addictive watching.",
    image: "/presets/edge-of-seat.jpg",
    feelings: ["excited", "bored"],
    intentions: ["keep me hooked", "give me adrenaline"],
    energy: "high",
    pace: "fast",
    intensity: "intense",
    darkness: "mixed",
    brainpower: "engaging",
    watchContext: "friends",
  },
  {
    key: "romantic-glow",
    label: "Romantic Glow",
    description: "Tender, intimate, emotionally warm.",
    image: "/presets/romantic-glow.jpg",
    feelings: ["romantic", "hopeful"],
    intentions: ["give me romance", "move me emotionally"],
    energy: "medium",
    pace: "balanced",
    intensity: "light",
    darkness: "light",
    brainpower: "engaging",
    watchContext: "date",
  },
];

function normalizePresetKey(value: string) {
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

export function findPresetDefinition(raw: string) {
  const normalized = normalizePresetKey(raw);
  return (
    QUICK_PRESETS.find(
      (preset) =>
        normalizePresetKey(preset.key) === normalized ||
        normalizePresetKey(preset.label) === normalized
    ) ?? null
  );
}

export function getFeelingTone(value: string): FeelingTone {
  return (
    FEELING_OPTIONS.find((item) => item.value === value)?.tone ?? {
      bg: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.16)",
      text: "#edf3fb",
      glow: "0 18px 44px rgba(0,0,0,0.14)",
    }
  );
}