// הרמוניה — קטלוג ההרמוניות
// נמל מהמנוע המאומת (reference/harmonia.html). מייצר בדיוק 597 מופעים.
// אזהרה: המספר 597 הוא בדיקת הרגרסיה של המשחק. אם הוא זז — נשבר משהו.
import type { CellId, Harmony } from './types';
import { cid } from './wheel';

export function buildCatalog(): Harmony[] {
  const seen = new Map<string, Harmony>();
  const add = (variant: string, cs: CellId[]): void => {
    const u = [...new Set(cs)];
    if (u.length !== cs.length) return;            // דחיית כפילות תא
    const key = [...u].sort().join('|');
    if (!seen.has(key)) seen.set(key, { variant, cells: u, key });
  };
  const C = cid;

  // ---- n=2 — ניגוד
  for (let r = 1; r <= 5; r++) {
    for (let s = 0; s < 6; s++) add('2a', [C(s, r), C(s + 6, r)]);        // משלים
    for (let s = 0; s < 12; s++) add('2c', [C(s, r), C(s + 5, r)]);       // משלים מפוצל
  }
  for (let s = 0; s < 12; s++) add('2b', [C(s, 1), C(s, 5)]);             // קוטב ערכי

  // ---- n=3 — דירוג
  for (let s = 0; s < 12; s++)
    for (let r = 1; r <= 3; r++) add('3a', [C(s, r), C(s, r + 1), C(s, r + 2)]); // דירוג ערכי
  for (let r = 1; r <= 5; r++) {
    for (let s = 0; s < 4; s++) add('3b', [C(s, r), C(s + 4, r), C(s + 8, r)]);  // טריאדה
    for (let s = 0; s < 12; s++) add('3c', [C(s, r), C(s + 1, r), C(s + 2, r)]); // דירוג גוני
  }

  // ---- n=4 — סדר
  for (let r = 1; r <= 5; r++) {
    for (let s = 0; s < 3; s++) add('4a', [0, 1, 2, 3].map((k) => C(s + 3 * k, r))); // מרובע
    for (let s = 0; s < 6; s++) add('4b', [C(s, r), C(s + 1, r), C(s + 6, r), C(s + 7, r)]); // מלבן
  }
  for (let s = 0; s < 12; s++)
    for (let r = 1; r <= 4; r++)
      add('4c', [C(s, r), C(s, r + 1), C(s + 1, r), C(s + 1, r + 1)]);    // שדה 2×2

  // ---- n=5 — תנועה
  for (let s = 0; s < 12; s++) {
    add('5a', [1, 2, 3, 4, 5].map((r) => C(s, r)));                       // עמוד מלא
    add('5c', [0, 1, 2, 3, 4].map((k) => C(s + k, 1 + k)));               // מדרגה עולה
    add('5c', [0, 1, 2, 3, 4].map((k) => C(s - k, 1 + k)));               // מדרגה יורדת
  }
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 12; s++) add('5b', [0, 1, 2, 3, 4].map((k) => C(s + k, r))); // סחיפה

  // ---- n=6 — מקצב
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 2; s++) add('6a', [0, 1, 2, 3, 4, 5].map((k) => C(s + 2 * k, r))); // משושה
  // מקצב מתחלף: הפרש טבעת אחת בלבד (a, a+1). צומצם מ-96 ל-48 — ראו SPEC §6.1
  for (let s = 0; s < 12; s++)
    for (let a = 1; a <= 4; a++)
      add('6b', [0, 1, 2, 3, 4, 5].map((k) => C(s + k, k % 2 === 0 ? a : a + 1)));
  for (let s = 0; s < 12; s++)
    for (let r = 1; r <= 4; r++)
      add('6c', [0, 1, 2].flatMap((k) => [C(s + k, r), C(s + k, r + 1)])); // קצב כפול 3×2

  // ---- n=7 — מחזור
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 12; s++) add('7a', [0, 1, 2, 3, 4, 5, 6].map((k) => C(s + k, r))); // קשת
  const sp = [1, 2, 3, 4, 5, 4, 3];                                       // ספירלה: טבעת עולה ויורדת
  for (let s = 0; s < 12; s++) {
    add('7c', sp.map((r, k) => C(s + 2 * k, r)));
    add('7c', sp.map((r, k) => C(s - 2 * k, r)));
  }

  return [...seen.values()];
}

export const CATALOG = buildCatalog();
