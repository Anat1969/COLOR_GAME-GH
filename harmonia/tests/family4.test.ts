// משפחה 4 (סדר) — פיילוט מודל הניקוד, בסיס 16.
// מאמת שהניקוד תואם בדיוק לספק ושכל תשע התבניות קיימות בגודל 4.
import { describe, it, expect } from 'vitest';
import { buildCatalog } from '../src/engine/catalog';
import { factorScore, FACTOR_PATTERNS } from '../src/engine/factors';
import { valueOf } from '../src/engine/scoring';
import { parse } from '../src/engine/wheel';

const cat = buildCatalog();

// הציונים המדויקים מתוך ה-JSON של המחברת
const SPEC: Record<string, number> = {
  '4a-run-v': 16, '4c-run-h': 16, '4a-square': 21, '4d-block': 22, '4b-rect': 25,
  '4e-twin': 25, '4f-spiral': 28, '4g-spiralv': 34, '4h-anchor': 34,
};

describe('מודל הניקוד של משפחה 4', () => {
  it('כל תשע התבניות מנוקדות בדיוק כמו בספק (בסיס 16)', () => {
    for (const [variant, score] of Object.entries(SPEC)) {
      expect(factorScore(variant), variant).toBe(score);
    }
  });

  it('valueOf מחיל את מודל הגורמים למשפחה 4', () => {
    const h = cat.find((x) => x.variant === '4g-spiralv')!;   // ספירלה משתנה → 34
    const v = valueOf(h);
    expect(v.pts).toBe(34);
    expect(v.fx).toBeDefined();
    expect(v.edge).toBe(false);
  });

  it('כל תשע התבניות קיימות בקטלוג, כולן בגודל 4', () => {
    for (const variant of Object.keys(SPEC)) {
      const inst = cat.filter((h) => h.variant === variant);
      expect(inst.length, variant).toBeGreaterThan(0);
      expect(inst.every((h) => h.cells.length === 4), variant).toBe(true);
    }
  });

  it('ציר יחיד/כפול תואם לגיאומטריה (אלכסון = dual)', () => {
    for (const variant of Object.keys(SPEC)) {
      const meta = FACTOR_PATTERNS[variant];
      for (const h of cat.filter((x) => x.variant === variant)) {
        const rs = new Set(h.cells.map((c) => parse(c).r));
        const ss = new Set(h.cells.map((c) => parse(c).s));
        const diagonal = rs.size > 1 && ss.size > 1;
        expect(meta.axes === 'dual', `${variant}`).toBe(diagonal);
      }
    }
  });

  it('אין וריאנטים ישנים 4a/4b/4c בקטלוג', () => {
    expect(cat.some((h) => ['4a', '4b', '4c'].includes(h.variant))).toBe(false);
  });
});
