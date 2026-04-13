// lib/reco/utils.ts
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uniqInts(v: unknown, max: number) {
  const out: number[] = [];
  const seen = new Set<number>();
  if (!Array.isArray(v)) return out;

  for (const x of v) {
    const n = Number(x);
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
  const L = Math.max(a.length, b.length);

  for (let i = 0; i < L; i++) {
    const v1 = a[i];
    const v2 = b[i];

    if (Number.isFinite(v1) && !seen.has(v1)) {
      seen.add(v1);
      out.push(v1);
      if (out.length >= max) return out;
    }
    if (Number.isFinite(v2) && !seen.has(v2)) {
      seen.add(v2);
      out.push(v2);
      if (out.length >= max) return out;
    }
  }

  return out.slice(0, max);
}

// stable stringify for params comparison
export function stableStringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number" || t === "boolean") return String(value);
  if (t === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(String(value));
}

// FNV-1a hash
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

export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}