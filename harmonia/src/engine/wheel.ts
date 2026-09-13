// הרמוניה — הגלגל: גוונים, גיאומטריה, שכנויות
import type { CellId } from './types';

export const SEGS = 12;
export const RINGS = 5;

export const SEG_NAMES = [
  'BLUE', 'INDIGO', 'PURPLE', 'VIOLET', 'RED', 'BRICK',
  'ORANGE', 'GOLD', 'YELLOW', 'LIME', 'GREEN', 'TEAL',
] as const;

export const SEG_NAMES_HE = [
  'כחול', 'אינדיגו', 'סגול', 'ויולט', 'אדום', 'לבֵנה',
  'כתום', 'זהב', 'צהוב', 'ליים', 'ירוק', 'טורקיז',
] as const;

/* ---------------------------------------------------------------------------
   כיול הגוונים — נדגם ישירות מ-reference/image.png.
   מרכז הדיסקה אותר מפיקסלים כרומטיים בלבד (הכיתוב אפור ונופל), ומכל תא
   נלקח ממוצע על פני מניפה של 15° בשלושה רדיוסים, תוך דילוג על החישורים הלבנים.
   הבהירות הוסדרה להיות מונוטונית יורדת בתוך כל פלח — טבעת = מדרגת ערך.
   אלה מספרים שנמדדו, לא נוחשו. שינוי כאן משנה את שיפוט הצבע של השחקן.
--------------------------------------------------------------------------- */
export const HUE = [213, 242, 267, 309, 355, 18, 30, 40, 53, 73, 128, 178];

/** רוויה לכל תא: [פלח][טבעת-1] */
export const SAT: number[][] = [
  [47, 48, 56, 75, 82],   // BLUE
  [32, 35, 43, 57, 56],   // INDIGO
  [29, 30, 34, 46, 47],   // PURPLE
  [28, 33, 36, 63, 59],   // VIOLET
  [84, 73, 69, 83, 82],   // RED
  [92, 82, 82, 70, 66],   // BRICK
  [89, 89, 90, 78, 66],   // ORANGE
  [87, 96, 94, 78, 67],   // GOLD
  [93, 96, 97, 78, 64],   // YELLOW
  [58, 46, 52, 55, 67],   // LIME
  [34, 39, 47, 52, 81],   // GREEN
  [31, 40, 45, 54, 75],   // TEAL
];

/** בהירות לכל תא: [פלח][טבעת-1] */
export const LIT: number[][] = [
  [81, 66, 60, 36, 24],   // BLUE
  [78, 67, 65, 38, 28],   // INDIGO
  [79, 68, 62, 35, 26],   // PURPLE
  [82, 70, 51, 35, 25],   // VIOLET
  [86, 78, 55, 44, 37],   // RED
  [86, 77, 61, 55, 41],   // BRICK
  [86, 78, 62, 59, 41],   // ORANGE
  [88, 80, 64, 59, 43],   // GOLD
  [88, 81, 66, 58, 45],   // YELLOW
  [88, 75, 53, 46, 30],   // LIME
  [85, 70, 48, 47, 24],   // GREEN
  [79, 64, 52, 40, 17],   // TEAL
];

// רדיוסים (px) — לב במרכז, חמש טבעות
export const RADII = [34, 76, 120, 168, 222, 290];
export const CX = 360;
export const CY = 346;

/** מקור האור — קבוע ביחס ללוח, מעל ומשמאל. כל הברק נגזר ממנו. */
export const LIGHT: [number, number] = [CX - 235, CY - 290];

export const cid = (s: number, r: number): CellId =>
  `${((s % SEGS) + SEGS) % SEGS}-${r}` as CellId;

export const parse = (id: CellId): { s: number; r: number } => {
  const [a, b] = id.split('-');
  return { s: +a, r: +b };
};

/* ---------- צבע ---------- */

export interface Hsl { h: number; s: number; l: number; }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const hslOf = (id: CellId): Hsl => {
  const { s, r } = parse(id);
  return { h: HUE[s], s: SAT[s][r - 1], l: LIT[s][r - 1] };
};

export const css = (c: Hsl, alpha = 1): string =>
  alpha >= 1
    ? `hsl(${c.h} ${c.s}% ${c.l}%)`
    : `hsl(${c.h} ${c.s}% ${c.l}% / ${alpha})`;

/** הזזת גוון: ds/dl באחוזים מוחלטים, dh במעלות */
export const shift = (c: Hsl, dl: number, ds = 0, dh = 0): Hsl => ({
  h: (((c.h + dh) % 360) + 360) % 360,
  s: clamp(c.s + ds, 0, 100),
  l: clamp(c.l + dl, 0, 100),
});

export const hexOf = (id: CellId): string => css(hslOf(id));

/* ---------- גיאומטריה ---------- */

const RAD = Math.PI / 180;
const HALF = 15 * RAD;                    // חצי רוחב הפלח
export const midAngle = (s: number): number => (-90 + s * 30) * RAD;

const pt = (rad: number, a: number): [number, number] => [
  CX + rad * Math.cos(a),
  CY + rad * Math.sin(a),
];

/**
 * נתיב SVG של מקטע טבעת. `pad` מכווץ את הצורה פנימה במרחק אחיד בכל
 * הכיוונים — כך נפער מרווח קבוע בין אבן לשכנתה, והאבן נקראת כגוף נפרד.
 */
export function sectorPath(s: number, r: number, pad = 0): string {
  const ri = RADII[r - 1] + pad;
  const ro = RADII[r] - pad;
  const m = midAngle(s);
  const ao = HALF - pad / ro;             // כיווץ זוויתי שנותן מרווח קווי אחיד
  const ai = HALF - pad / ri;
  const [x1, y1] = pt(ro, m - ao);
  const [x2, y2] = pt(ro, m + ao);
  const [x3, y3] = pt(ri, m + ai);
  const [x4, y4] = pt(ri, m - ai);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x1)} ${f(y1)}A${f(ro)} ${f(ro)} 0 0 1 ${f(x2)} ${f(y2)}` +
         `L${f(x3)} ${f(y3)}A${f(ri)} ${f(ri)} 0 0 0 ${f(x4)} ${f(y4)}Z`;
}

/** תאימות לאחור — הצורה המלאה, ללא מרווח */
export const sector = (s: number, r: number): string => sectorPath(s, r, 0);

/** נקודת מרכז התא — למשיכת קווי הצורה החתימתית */
export function center(id: CellId): [number, number] {
  const c = parse(id);
  return pt((RADII[c.r - 1] + RADII[c.r]) / 2, midAngle(c.s));
}

/** מחצית המימד הקטן של התא — סקאלת הברק והמשטח. תלוי בטבעת בלבד. */
export function cellScale(r: number): number {
  const rm = (RADII[r - 1] + RADII[r]) / 2;
  const radial = RADII[r] - RADII[r - 1];
  const tangential = 2 * HALF * rm;
  return Math.min(radial, tangential) / 2;
}

/**
 * גיאומטריית התאורה של תא בודד: לאן פונה האור, היכן הברק,
 * והיכן הקאוסטיקה — הכתם שהאור ממקד בצד הנגדי אחרי שעבר בזכוכית.
 */
export function lighting(id: CellId) {
  const { r } = parse(id);
  const c = center(id);
  const k = cellScale(r);
  let dx = LIGHT[0] - c[0];
  let dy = LIGHT[1] - c[1];
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  return {
    c,
    k,
    dir: [dx, dy] as [number, number],
    /** מוקד הכיפה — מעט לכיוון האור */
    hi: [c[0] + dx * k * 0.42, c[1] + dy * k * 0.42] as [number, number],
    /** הברק החד */
    spec: [c[0] + dx * k * 0.62, c[1] + dy * k * 0.62] as [number, number],
    /** הקאוסטיקה — בצד הרחוק מהאור */
    caustic: [c[0] - dx * k * 0.52, c[1] - dy * k * 0.52] as [number, number],
    /** זווית הברק, במעלות — מיושר למשיק הטבעת */
    tilt: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

/** תווית פלח, מחוץ לטבעת החיצונית הפעילה */
export function labelPos(s: number, outerRing = RINGS): [number, number] {
  const [x, y] = pt(RADII[outerRing] + 30, midAngle(s));
  return [x, y + 4];
}
