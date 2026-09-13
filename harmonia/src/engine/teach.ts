// הרמוניה — שכבת ההוראה. פונקציות טהורות מעל המנוע הקיים.
//
// כשבחירה אינה יוצרת הרמוניה, המשחק לא צריך פשוט לדחות אותה — הוא צריך
// ללמד. `analyzeSelection` מזהה את התבנית הקטלוגית שהבחירה *הכי קרובה*
// להשלים, ומחזיר נתונים מובְנים: איזו משפחה/וריאנט, כמה אבנים כבר במקום,
// כמה חסרות, וכמה אבנים בבחירה אינן שייכות (ערבוב).
//
// חשוב: הקובץ נשאר טהור — אין כאן טקסט עברי ואין תלות ב-data/content.
// ה-UI מרכיב את ההסבר מהמבנה הזה. כך המנוע נבדק ביחידות, וההוראה = הסברים
// בלבד (אין מזהי תאים להארה על הגלגל).
import type { CellId, Family, Harmony, Owner, Scored } from './types';
import { detect } from './scoring';

/** תיאור ההרמוניה הקרובה ביותר שהבחירה בונה אליה */
export interface NearMiss {
  variant: string;   // '3a', '2a', ...
  n: Family;         // גודל המשפחה
  have: number;      // אבני הבחירה ששייכות לתבנית
  need: number;      // גודל התבנית
  missing: number;   // אבנים שעוד חסרות (תא ריק, לא על הלוח)
  extra: number;     // אבני הבחירה שאינן חלק מהתבנית — סימן לערבוב
}

export type Analysis =
  | { ok: true; list: Scored[] }
  | { ok: false; near: NearMiss | null; size?: { need: number; have: number } };

/** מפתח ממוין של בחירה — תואם למפתחות הקטלוג */
const keyOf = (cells: CellId[]): string => [...cells].sort().join('|');

/**
 * מהלך הדרכה חוקי: בדיוק `require` אבנים שהן בעצמן הרמוניה פעילה (משפחה require),
 * שטרם נוקדה. מחזיר את ההרמוניה, או null.
 */
export function teachingMove(
  sel: CellId[],
  require: number,
  ledger: Set<string>,
  active: Harmony[],
): Harmony | null {
  if (sel.length !== require) return null;
  const k = keyOf(sel);
  if (ledger.has(k)) return null;
  return active.find((h) => h.key === k) ?? null;
}

/**
 * מנתח את הבחירה הנוכחית.
 * אם היא יוצרת הרמוניה — מחזיר אותה (כמו detect).
 * אחרת — מחפש בקטלוג הפעיל את התבנית שהבחירה הכי קרובה להשלים.
 *
 * ניקוד הקרבה: כל אבן בבחירה ששייכת לתבנית שווה הרבה; אבן חסרה מפחיתה;
 * אבן "מערבבת" (בבחירה אך לא בתבנית) מפחיתה — כך מודגשת הבחירה הנקייה ביותר.
 */
export function analyzeSelection(
  board: Map<CellId, Owner>,
  sel: CellId[],
  ledger: Set<string>,
  active: Harmony[],
  require?: number,
): Analysis {
  // רמת הדרכה: חוקי רק אם בדיוק `require` אבנים הן הרמוניה שלמה ממשפחה require.
  if (require !== undefined) {
    const list = detect(board, sel, ledger, active);
    const selSet0 = new Set(sel);
    const exact = list.filter(
      (h) => h.cells.length === require && h.cells.every((c) => selSet0.has(c)),
    );
    if (sel.length === require && exact.length) return { ok: true, list: exact };
    const near = nearestMiss(board, sel, ledger, active);
    return { ok: false, near, size: { need: require, have: sel.length } };
  }

  const list = detect(board, sel, ledger, active);
  if (list.length) return { ok: true, list };
  return { ok: false, near: nearestMiss(board, sel, ledger, active) };
}

/** התבנית הקטלוגית שהבחירה הכי קרובה להשלים — הסבר בלבד, בלי מזהי תאים. */
function nearestMiss(
  board: Map<CellId, Owner>,
  sel: CellId[],
  ledger: Set<string>,
  active: Harmony[],
): NearMiss | null {
  const selSet = new Set(sel);
  let best: NearMiss | null = null;
  let bestScore = -Infinity;

  for (const h of active) {
    if (ledger.has(h.key)) continue;
    let have = 0;
    let onBoard = 0;
    for (const c of h.cells) {
      if (selSet.has(c)) have++;
      else if (board.has(c)) onBoard++;
    }
    if (have < 1) continue;                        // לא רלוונטי אם הבחירה לא תורמת כלום
    const need = h.cells.length;
    const missing = need - have - onBoard;         // תאים ריקים שצריך להוסיף
    const extra = sel.length - have;               // אבני בחירה שאינן בתבנית
    const score = have * 10 - missing * 3 - extra * 2;
    if (score > bestScore) {
      bestScore = score;
      best = { variant: h.variant, n: +h.variant[0] as Family, have, need, missing, extra };
    }
  }
  return best;
}
