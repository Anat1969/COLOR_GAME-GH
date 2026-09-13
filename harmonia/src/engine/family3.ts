// הרמוניה — מודל הניקוד של משפחה 3 (דירוג).
// פיילוט למודל חדש: ניקוד = round(base × distance × axes × symmetry).
// עבור משפחה 3 המודל הזה מחליף את טוהר/קצה. שאר המשפחות נשארות במודל הקיים.
// (הגדרה מהמחברת — ראו JSON המקור.)

export type Distance = 'adjacent' | 'medium' | 'far';
export type Axes = 'single' | 'dual';
export type Symmetry = 'even' | 'uneven';

export interface F3Meta {
  distance: Distance;
  axes: Axes;
  symmetry: Symmetry;
}

export const F3_BASE = 9;
export const F3_DIST: Record<Distance, number> = { adjacent: 1.0, medium: 1.15, far: 1.3 };
export const F3_AXES: Record<Axes, number> = { single: 1.0, dual: 1.35 };
export const F3_SYM: Record<Symmetry, number> = { even: 1.0, uneven: 1.2 };

// תשע תבניות משפחה 3, לפי מפתח הווריאנט. כולן מתחילות ב-'3' כדי לשמור
// על המוסכמה שהתו הראשון הוא מספר המשפחה.
export const FAMILY3: Record<string, F3Meta> = {
  '3a': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // דירוג ערכי
  '3b': { distance: 'far', axes: 'single', symmetry: 'even' },        // טריאדה
  '3c': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // דירוג גוני
  '3d': { distance: 'medium', axes: 'single', symmetry: 'even' },     // דירוג ערכי מדלג
  '3e': { distance: 'medium', axes: 'single', symmetry: 'uneven' },   // משלים מפוצל
  '3f': { distance: 'adjacent', axes: 'dual', symmetry: 'uneven' },   // עוגן סמוך
  '3g': { distance: 'far', axes: 'dual', symmetry: 'even' },          // ספירלה
  '3h': { distance: 'far', axes: 'dual', symmetry: 'uneven' },        // עוגן מנוגד
  '3i': { distance: 'far', axes: 'dual', symmetry: 'uneven' },        // ספירלה משתנה
};

/** ניקוד תבנית משפחה 3: round(9 × distance × axes × symmetry) */
export function family3Score(variant: string): number {
  const m = FAMILY3[variant];
  if (!m) return 0;
  return Math.round(F3_BASE * F3_DIST[m.distance] * F3_AXES[m.axes] * F3_SYM[m.symmetry]);
}
