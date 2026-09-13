// משפחה 3 — פיילוט מודל הניקוד החדש.
// מאמת ששכבת הניקוד מחזירה בדיוק את הציונים שהמחברת הגדירה בספק,
// ושכל תשע התבניות קיימות בקטלוג בגודל 3.
import { describe, it, expect } from 'vitest';
import { buildCatalog } from '../src/engine/catalog';
import { factorScore, FACTOR_PATTERNS } from '../src/engine/factors';
import { valueOf, purity } from '../src/engine/scoring';
import { parse } from '../src/engine/wheel';

const cat = buildCatalog();
const FAMILY3 = Object.fromEntries(
  Object.entries(FACTOR_PATTERNS).filter(([k]) => k[0] === '3'),
);
const family3Score = factorScore;

// הציונים המדויקים מתוך ה-JSON של המחברת
const SPEC: Record<string, number> = {
  '3a': 9, '3c': 9, '3d': 10, '3b': 12, '3e': 12,
  '3f': 15, '3g': 16, '3h': 19, '3i': 19,
};

describe('מודל הניקוד של משפחה 3', () => {
  it('כל תשע התבניות מנוקדות בדיוק כמו בספק', () => {
    for (const [variant, score] of Object.entries(SPEC)) {
      expect(family3Score(variant)).toBe(score);
    }
  });

  it('valueOf מחיל את מודל משפחה 3 (distance/axes/symmetry, לא טוהר/קצה)', () => {
    const h = cat.find((x) => x.variant === '3h')!;    // עוגן מנוגד → 19
    const v = valueOf(h);
    expect(v.pts).toBe(19);
    expect(v.fx).toBeDefined();
    expect(v.edge).toBe(false);
  });

  it('כל תשע התבניות קיימות בקטלוג, כולן בגודל 3', () => {
    for (const variant of Object.keys(FAMILY3)) {
      const inst = cat.filter((h) => h.variant === variant);
      expect(inst.length, variant).toBeGreaterThan(0);
      expect(inst.every((h) => h.cells.length === 3), variant).toBe(true);
    }
  });

  it('ציר יחיד תואם גיאומטריה טהורה; שני צירים תואם אלכסון', () => {
    for (const variant of Object.keys(FAMILY3)) {
      const meta = FAMILY3[variant];
      const inst = cat.filter((h) => h.variant === variant);
      for (const h of inst) {
        const rs = new Set(h.cells.map((c) => parse(c).r));
        const ss = new Set(h.cells.map((c) => parse(c).s));
        const diagonal = rs.size > 1 && ss.size > 1;
        expect(meta.axes === 'dual', `${variant} axes vs geometry`).toBe(diagonal);
      }
    }
  });

  it('הבסיס נשאר 9 והמכפילים בטווח הצפוי', () => {
    // הבסיס × המכפיל המרבי לא עובר את הציון הגבוה (19)
    expect(family3Score('3h')).toBeLessThanOrEqual(20);
    // דירוג ערכי בסיסי נשאר על 9
    expect(family3Score('3a')).toBe(9);
  });

  it('טהור־גוני של 3c הוא ציר יחיד (מודל חדש מבטל את הבחנת גוני/ערכי)', () => {
    // בעבר 3c היה purity hue ×1.0; המודל החדש: single axis ×1.0 — הציון 9 נשמר
    const h = cat.find((x) => x.variant === '3c')!;
    expect(purity(h.cells).kind).toBe('hue');   // הגיאומטריה עדיין גונית
    expect(valueOf(h).pts).toBe(9);              // אך הניקוד לפי המודל החדש
  });
});
