// Shared helper functions used by the recommendation layer and any supporting
// client-side utilities that need stable keys, seeded randomness, or bounded
// numeric operations.

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uniqInts(value: unknown, max: number) {
  const out: number[] = [];
  const seen = new Set<number>();

  if (!Array.isArray(value)) return out;

  for (const item of value) {
    const n = Number(item);
    if (!Number.isFinite(n)) continue;

    const i = Math.trunc(n);
    if (seen.has(i)) continue;

    seen.add(i);
    out.push(i);

    if (out.length >= max) break;
  }

  return out;
}

export function interleaveMerge(a: number[], b: number[], max: number) {
  const out: number[] = [];
  const seen = new Set<number>();
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i++) {
    const first = a[i];
    const second = b[i];

    if (Number.isFinite(first) && !seen.has(first)) {
      seen.add(first);
      out.push(first);
      if (out.length >= max) return out;
    }

    if (Number.isFinite(second) && !seen.has(second)) {
      seen.add(second);
      out.push(second);
      if (out.length >= max) return out;
    }
  }

  return out.slice(0, max);
}

// Stable stringify is useful when object key order should not affect cache keys
// or deterministic hashes.
export function stableStringify(value: unknown): string {
  if (value === null) return "null";

  const type = typeof value;

  if (type === "number" || type === "boolean") {
    return String(value);
  }

  if (type === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map(
      (key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`
    );

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(String(value));
}

// FNV-1a is fast and stable enough for lightweight deterministic keying.
export function hashFNV1a(str: string) {
  let h = 2166136261;

  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

export function paramsKey(params: unknown) {
  return hashFNV1a(stableStringify(params)).toString(16);
}

export function seedFromString(str: string) {
  return hashFNV1a(str);
}

// Small deterministic PRNG used where lightweight seeded randomness is enough.
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}