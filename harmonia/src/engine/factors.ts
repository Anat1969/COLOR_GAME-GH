// הרמוניה — מודל הניקוד מבוסס-גורמים (distance / axes / symmetry).
// מודל אחיד לכל משפחה שהוגדרה בו: ניקוד = round(base × distance × axes × symmetry),
// כאשר base = n² (2→4, 3→9, 4→16, …). מחליף עבור אותן משפחות את טוהר/קצה.
// משפחות שאינן ברישום נשארות במודל הקיים (scoring.ts).
// הוגדר לפי ה-JSON של המחברת, משפחה אחר משפחה.

export type Distance = 'adjacent' | 'medium' | 'far';
export type Axes = 'single' | 'dual';
export type Symmetry = 'even' | 'uneven';

export interface FactorMeta {
  distance: Distance;
  axes: Axes;
  symmetry: Symmetry;
}

export const DIST: Record<Distance, number> = { adjacent: 1.0, medium: 1.15, far: 1.3 };
export const AXES: Record<Axes, number> = { single: 1.0, dual: 1.35 };
export const SYM: Record<Symmetry, number> = { even: 1.0, uneven: 1.2 };

// רישום התבניות לפי מפתח הווריאנט. התו הראשון של המפתח הוא מספר המשפחה.
export const FACTOR_PATTERNS: Record<string, FactorMeta> = {
  // ---- משפחה 3 — דירוג
  '3a': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // דירוג ערכי
  '3b': { distance: 'far', axes: 'single', symmetry: 'even' },        // טריאדה
  '3c': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // דירוג גוני
  '3d': { distance: 'medium', axes: 'single', symmetry: 'even' },     // דירוג ערכי מדלג
  '3e': { distance: 'medium', axes: 'single', symmetry: 'uneven' },   // משלים מפוצל
  '3f': { distance: 'adjacent', axes: 'dual', symmetry: 'uneven' },   // עוגן סמוך
  '3g': { distance: 'far', axes: 'dual', symmetry: 'even' },          // ספירלה
  '3h': { distance: 'far', axes: 'dual', symmetry: 'uneven' },        // עוגן מנוגד
  '3i': { distance: 'far', axes: 'dual', symmetry: 'uneven' },        // ספירלה משתנה

  // ---- משפחה 4 — סדר
  '4a-run-v': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // עמוד ערכי
  '4c-run-h': { distance: 'adjacent', axes: 'single', symmetry: 'even' },   // רצף גוני
  '4a-square': { distance: 'far', axes: 'single', symmetry: 'even' },       // מרובע
  '4d-block': { distance: 'adjacent', axes: 'dual', symmetry: 'even' },     // שדה
  '4b-rect': { distance: 'far', axes: 'single', symmetry: 'uneven' },       // מלבן
  '4e-twin': { distance: 'medium', axes: 'dual', symmetry: 'even' },        // צמד כפול
  '4f-spiral': { distance: 'far', axes: 'dual', symmetry: 'even' },         // ספירלה
  '4g-spiralv': { distance: 'far', axes: 'dual', symmetry: 'uneven' },      // ספירלה משתנה
  '4h-anchor': { distance: 'far', axes: 'dual', symmetry: 'uneven' },       // עוגן משולש
};

/** ניקוד תבנית מבוסס-גורמים: round(n² × distance × axes × symmetry) */
export function factorScore(variant: string): number {
  const m = FACTOR_PATTERNS[variant];
  if (!m) return 0;
  const family = +variant[0];
  const base = family * family;
  return Math.round(base * DIST[m.distance] * AXES[m.axes] * SYM[m.symmetry]);
}
