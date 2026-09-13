// הרמוניה — זיהוי וניקוד. פונקציות טהורות, נטולות UI.
import type { CellId, Harmony, Scored, Family } from './types';
import { parse } from './wheel';
import { FACTOR_PATTERNS, factorScore } from './factors';

export const BASE: Record<Family, number> = { 2: 4, 3: 9, 4: 16, 5: 25, 6: 36, 7: 49 };

/** מכפיל הטוהר: על איזה ציר נחצה היחס */
export function purity(cells: CellId[]): Scored['purity'] {
  const rs = new Set(cells.map((c) => parse(c).r));
  const ss = new Set(cells.map((c) => parse(c).s));
  if (rs.size === 1) return { m: 1.0, label: 'טהור־גוני', kind: 'hue' };
  if (ss.size === 1) return { m: 1.1, label: 'טהור־ערכי', kind: 'value' };
  return { m: 1.35, label: 'אלכסוני', kind: 'diagonal' };
}

/**
 * ערך הרמוניה בודדת.
 * תבניות שברישום הגורמים (משפחות 3, 4, …): round(n² × distance × axes × symmetry)
 * — ראו engine/factors.ts. שאר המשפחות: בסיס × טוהר × קצה (המודל הקיים).
 */
export function valueOf(h: Harmony): {
  pts: number; purity: Scored['purity']; edge: boolean; fx?: Scored['fx'];
} {
  const p = purity(h.cells);
  const n = +h.variant[0] as Family;
  const fx = FACTOR_PATTERNS[h.variant];
  if (fx) {
    return { pts: factorScore(h.variant), purity: p, edge: false, fx };
  }
  const rs = new Set(h.cells.map((c) => parse(c).r));
  const edge = rs.has(1) && rs.has(5);
  return { pts: BASE[n] * p.m * (edge ? 1.1 : 1.0), purity: p, edge };
}

/**
 * מוצא הרמוניות שהושלמו בתור זה.
 * כלל מכריע (CLAUDE.md ממצא 1): נדרשות ≥2 אבנים חדשות מ-`placed`.
 * מחזיר עד שלוש הגבוהות (תקרת הניקוד).
 */
export function detect(
  board: Map<CellId, unknown>,
  placed: CellId[],
  ledger: Set<string>,
  active: Harmony[],
): Scored[] {
  const set = new Set(placed);
  const out: Scored[] = [];
  for (const h of active) {
    if (ledger.has(h.key)) continue;
    let fresh = 0;
    let ok = true;
    for (const c of h.cells) {
      if (set.has(c)) fresh++;
      else if (!board.has(c)) { ok = false; break; }
    }
    if (!ok || fresh < 2) continue;
    const v = valueOf(h);
    out.push({ ...h, ...v, n: +h.variant[0] as Family });
  }
  out.sort((a, b) => b.pts - a.pts);
  return out.slice(0, 3);
}

/** סכום התור, כולל מכפיל האי-סימטריה (זוגיות מעורבת ×1.25) */
export function tally(list: Scored[]): { total: number; asym: boolean } {
  if (!list.length) return { total: 0, asym: false };
  const par = new Set(list.map((h) => h.n % 2));
  const asym = par.size > 1;
  const total = list.reduce((a, h) => a + h.pts, 0) * (asym ? 1.25 : 1.0);
  return { total, asym };
}
