/**
 * Reusable ranked fuzzy matcher with three priority tiers.
 *
 * Each field tier (high / medium / low) goes through the same match cascade
 * — exact → prefix → word-start → contains → subsequence — but at different
 * score bands. Highest band always wins, so e.g. a shortcode "smile" beats
 * a name "smiling face" even on identical query "smile".
 */

type Tier = {
  exact: number;
  prefix: number;
  word: number;
  contains: number;
  fuzzy: number;
};

const HIGH: Tier = { exact: 1000, prefix: 800, word: 700, contains: 600, fuzzy: 400 };
const MED: Tier = { exact: 700, prefix: 500, word: 400, contains: 250, fuzzy: 100 };
const LOW: Tier = { exact: 200, prefix: 150, word: 120, contains: 80, fuzzy: 0 };

export type FuzzyFields = {
  high?: string | string[] | undefined;
  medium?: string | string[] | undefined;
  low?: string | string[] | undefined;
};

function subsequenceScore(hay: string, needle: string): number {
  let hi = 0;
  let score = 0;
  let prev = -2;
  for (let ni = 0; ni < needle.length; ni++) {
    const ch = needle.charCodeAt(ni);
    let found = -1;
    for (let i = hi; i < hay.length; i++) {
      if (hay.charCodeAt(i) === ch) {
        found = i;
        break;
      }
    }
    if (found === -1) return 0;
    if (found === prev + 1) score += 8;
    const before = hay.charCodeAt(found - 1);
    if (found === 0 || before === 32 || before === 45 || before === 95) {
      score += 4;
    }
    score += 1;
    prev = found;
    hi = found + 1;
  }
  return Math.max(0, score - (hay.length - needle.length) * 0.05);
}

function wordStart(name: string, q: string): boolean {
  for (let i = 0; i < name.length; i++) {
    const before = i === 0 ? 32 : name.charCodeAt(i - 1);
    if ((before === 32 || before === 45 || before === 95) && name.startsWith(q, i)) {
      return true;
    }
  }
  return false;
}

function scoreOne(
  values: string | string[] | undefined,
  q: string,
  tier: Tier,
): number {
  if (!values) return 0;
  const arr = Array.isArray(values) ? values : [values];
  let best = 0;
  for (const v of arr) {
    const s = v.toLowerCase();
    if (s === q) return tier.exact;
    if (s.startsWith(q)) {
      if (tier.prefix > best) best = tier.prefix;
      continue;
    }
    if (wordStart(s, q)) {
      if (tier.word > best) best = tier.word;
      continue;
    }
    if (s.includes(q)) {
      if (tier.contains > best) best = tier.contains;
      continue;
    }
    if (tier.fuzzy > 0) {
      const sub = subsequenceScore(s, q);
      if (sub > 0) {
        const candidate = tier.fuzzy + sub;
        if (candidate > best) best = candidate;
      }
    }
  }
  return best;
}

export function scoreFuzzy(q: string, fields: FuzzyFields): number {
  if (!q) return 1;
  const lower = q.toLowerCase();
  const h = scoreOne(fields.high, lower, HIGH);
  if (h >= HIGH.exact) return h;
  const m = scoreOne(fields.medium, lower, MED);
  const l = scoreOne(fields.low, lower, LOW);
  return h > m ? (h > l ? h : l) : m > l ? m : l;
}

export function rankFuzzy<T>(
  items: Iterable<T>,
  query: string,
  extract: (item: T) => FuzzyFields,
  maxResults = Infinity,
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const score = scoreFuzzy(q, extract(item));
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: T[] = [];
  const cap = Math.min(maxResults, scored.length);
  for (let i = 0; i < cap; i++) out.push(scored[i]!.item);
  return out;
}
