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

  // ---- n=3 — דירוג (מורחב: פיילוט מודל הניקוד החדש, ראו engine/family3.ts)
  // כל התבניות ממשפחה 3 ממופתחות '3a'..'3i'. הגיאומטריה הוגדרה כאן ומוצגת
  // בדיאגרמה לאישור; שינוי כאן משנה את מספר הרגרסיה.
  for (let s = 0; s < 12; s++)
    for (let r = 1; r <= 3; r++) add('3a', [C(s, r), C(s, r + 1), C(s, r + 2)]); // דירוג ערכי
  for (let r = 1; r <= 5; r++) {
    for (let s = 0; s < 4; s++) add('3b', [C(s, r), C(s + 4, r), C(s + 8, r)]);  // טריאדה
    for (let s = 0; s < 12; s++) add('3c', [C(s, r), C(s + 1, r), C(s + 2, r)]); // דירוג גוני
  }
  // דירוג ערכי מדלג — אותו פלח, טבעות 1-3-5
  for (let s = 0; s < 12; s++) add('3d', [C(s, 1), C(s, 3), C(s, 5)]);
  // משלים מפוצל — אותה טבעת, פלח ושני שכני-הנגדי (s, s+5, s+7)
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 12; s++) add('3e', [C(s, r), C(s + 5, r), C(s + 7, r)]);
  // עוגן סמוך — זוג באותו פלח (r,r+1) + שלישית בפלח שכן, בטבעת התחתונה
  for (let r = 1; r <= 4; r++)
    for (let s = 0; s < 12; s++) add('3f', [C(s, r), C(s, r + 1), C(s + 1, r)]);
  // ספירלה — פלח וטבעת עולים יחד בצעד קבוע (שני כיוונים)
  for (let r = 1; r <= 3; r++)
    for (let s = 0; s < 12; s++) {
      add('3g', [C(s, r), C(s + 1, r + 1), C(s + 2, r + 2)]);
      add('3g', [C(s, r), C(s - 1, r + 1), C(s - 2, r + 2)]);
    }
  // עוגן מנוגד — זוג באותו פלח (r,r+1) + שלישית בפלח הנגדי (s+6)
  for (let r = 1; r <= 4; r++)
    for (let s = 0; s < 12; s++) add('3h', [C(s, r), C(s, r + 1), C(s + 6, r)]);
  // ספירלה משתנה — פלח וטבעת עולים יחד בצעד לא-קבוע (1 ואז 2 פלחים; שני כיוונים)
  for (let r = 1; r <= 3; r++)
    for (let s = 0; s < 12; s++) {
      add('3i', [C(s, r), C(s + 1, r + 1), C(s + 3, r + 2)]);
      add('3i', [C(s, r), C(s - 1, r + 1), C(s - 3, r + 2)]);
    }

  // ---- n=4 — סדר (מורחב: פיילוט מודל הניקוד, ראו engine/factors.ts)
  // עמוד ערכי — אותו פלח, ארבע טבעות רצופות
  for (let s = 0; s < 12; s++)
    for (let r = 1; r <= 2; r++) add('4a-run-v', [0, 1, 2, 3].map((k) => C(s, r + k)));
  // רצף גוני — אותה טבעת, ארבעה פלחים רצופים
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 12; s++) add('4c-run-h', [0, 1, 2, 3].map((k) => C(s + k, r)));
  // מרובע — אותה טבעת, שלושה פלחים בין כל זוג (s, s+3, s+6, s+9)
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 3; s++) add('4a-square', [0, 1, 2, 3].map((k) => C(s + 3 * k, r)));
  // שדה — שני פלחים סמוכים × שתי טבעות סמוכות
  for (let r = 1; r <= 4; r++)
    for (let s = 0; s < 12; s++)
      add('4d-block', [C(s, r), C(s + 1, r), C(s, r + 1), C(s + 1, r + 1)]);
  // מלבן — אותה טבעת, שני צמדים סמוכים מנוגדים (s, s+1, s+6, s+7)
  for (let r = 1; r <= 5; r++)
    for (let s = 0; s < 6; s++) add('4b-rect', [C(s, r), C(s + 1, r), C(s + 6, r), C(s + 7, r)]);
  // צמד כפול — שני זוגות ערכיים (פלח + טבעת סמוכה) בשני פלחים במרחק 2
  for (let r = 1; r <= 4; r++)
    for (let s = 0; s < 12; s++)
      add('4e-twin', [C(s, r), C(s, r + 1), C(s + 2, r), C(s + 2, r + 1)]);
  // ספירלה — פלח וטבעת עולים יחד בצעד קבוע (שני כיוונים)
  for (let r = 1; r <= 2; r++)
    for (let s = 0; s < 12; s++) {
      add('4f-spiral', [0, 1, 2, 3].map((k) => C(s + k, r + k)));
      add('4f-spiral', [0, 1, 2, 3].map((k) => C(s - k, r + k)));
    }
  // ספירלה משתנה — צעד פלח לא-קבוע (1,2,1) והטבעת עולה (שני כיוונים)
  const step = [0, 1, 3, 4];
  for (let r = 1; r <= 2; r++)
    for (let s = 0; s < 12; s++) {
      add('4g-spiralv', step.map((d, k) => C(s + d, r + k)));
      add('4g-spiralv', step.map((d, k) => C(s - d, r + k)));
    }
  // עוגן משולש — שלוש באותו פלח (r,r+1,r+2) + רביעית בפלח הנגדי, בטבעת האמצעית
  for (let r = 1; r <= 3; r++)
    for (let s = 0; s < 12; s++)
      add('4h-anchor', [C(s, r), C(s, r + 1), C(s, r + 2), C(s + 6, r + 1)]);

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
