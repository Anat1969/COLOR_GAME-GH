// כיול הגלגל וגיאומטריית האבן.
// טבלת הגוונים נדגמה מ-reference/image.png. הבדיקות כאן שומרות על
// התכונות שהופכות אותה לקריאה: טבעת = מדרגת ערך, גוון עולה סביב הגלגל,
// וכל אבן נשארת בתוך התא שלה.
import { describe, it, expect } from 'vitest';
import {
  HUE, SAT, LIT, SEGS, RINGS, RADII, SEG_NAMES, SEG_NAMES_HE,
  cid, parse, hslOf, css, shift, sectorPath, center, cellScale, labelPos, lighting,
} from '../src/engine/wheel';

const cells = Array.from({ length: SEGS }, (_, s) =>
  Array.from({ length: RINGS }, (_, r) => cid(s, r + 1)),
).flat();

describe('כיול הגוונים', () => {
  it('שתים־עשרה משפחות גוון, לכל אחת שם עברי ואנגלי', () => {
    expect(HUE).toHaveLength(SEGS);
    expect(SEG_NAMES).toHaveLength(SEGS);
    expect(SEG_NAMES_HE).toHaveLength(SEGS);
    expect(new Set(SEG_NAMES_HE).size).toBe(SEGS);
  });

  it('הגוונים עולים מונוטונית סביב הגלגל, ללא חזרה אחורה', () => {
    // פריסת המעגל לישר: ברגע שחצינו את 360 מוסיפים סיבוב ומחזיקים בו.
    let turns = 0;
    const flat = HUE.map((h, i) => {
      if (i > 0 && h < HUE[i - 1]) turns += 360;
      return h + turns;
    });
    for (let s = 1; s < SEGS; s++) expect(flat[s]).toBeGreaterThan(flat[s - 1]);
    // סיבוב אחד בדיוק: הגלגל נסגר ואינו כופל גוונים
    expect(turns).toBe(360);
    expect(flat[SEGS - 1] - flat[0]).toBeLessThan(360);
  });

  it('טבלאות הרוויה והבהירות מכסות 12×5', () => {
    expect(SAT).toHaveLength(SEGS);
    expect(LIT).toHaveLength(SEGS);
    for (let s = 0; s < SEGS; s++) {
      expect(SAT[s]).toHaveLength(RINGS);
      expect(LIT[s]).toHaveLength(RINGS);
    }
  });

  // זו התכונה שעליה נשען הניקוד: "טהור־ערכי" מניח שטבעת היא מדרגת ערך.
  it('הבהירות יורדת מונוטונית מטבעת 1 לטבעת 5, בכל פלח', () => {
    for (let s = 0; s < SEGS; s++) {
      for (let r = 1; r < RINGS; r++) {
        expect(LIT[s][r]).toBeLessThan(LIT[s][r - 1]);
      }
    }
  });

  it('כל 60 הערכים בתחום HSL תקין', () => {
    for (const id of cells) {
      const { h, s, l } = hslOf(id);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
      expect(l).toBeGreaterThan(0);
      expect(l).toBeLessThan(100);
    }
  });

  it('טבעת 1 בהירה וטבעת 5 כהה בכל פלח — הקצוות נבדלים היטב', () => {
    for (let s = 0; s < SEGS; s++) {
      expect(LIT[s][0]).toBeGreaterThanOrEqual(70);
      expect(LIT[s][4]).toBeLessThanOrEqual(50);
      expect(LIT[s][0] - LIT[s][4]).toBeGreaterThan(25);
    }
  });

  it('shift נצמד לתחום ואינו גולש', () => {
    expect(shift({ h: 10, s: 95, l: 90 }, +30, +30).l).toBe(100);
    expect(shift({ h: 10, s: 5, l: 10 }, -30, -30).s).toBe(0);
    expect(shift({ h: 350, s: 50, l: 50 }, 0, 0, 20).h).toBe(10);
    expect(css({ h: 1, s: 2, l: 3 }, 0.5)).toBe('hsl(1 2% 3% / 0.5)');
  });
});

describe('גיאומטריית התא', () => {
  it('parse הוא ההיפוך של cid', () => {
    for (const id of cells) {
      const { s, r } = parse(id);
      expect(cid(s, r)).toBe(id);
    }
  });

  it('cid עוטף פלחים שליליים ומעל 12', () => {
    expect(cid(-1, 3)).toBe(cid(11, 3));
    expect(cid(13, 3)).toBe(cid(1, 3));
  });

  it('כל נתיב תא הוא נתיב SVG סגור ותקין', () => {
    for (const id of cells) {
      const { s, r } = parse(id);
      const d = sectorPath(s, r, 2.6);
      expect(d).toMatch(/^M[\d.-]+ [\d.-]+A.+Z$/);
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  it('מרווח חיובי מכווץ את הצורה — האבן אינה נוגעת בשכנתה', () => {
    // נקודת ההתחלה של הנתיב יושבת על הרדיוס החיצוני; מרווח מקרב אותה למרכז.
    const radiusOfStart = (d: string) => {
      const [x, y] = d.slice(1).split('A')[0].split(' ').map(Number);
      return Math.hypot(x - 360, y - 346);
    };
    for (let r = 1; r <= RINGS; r++) {
      expect(radiusOfStart(sectorPath(0, r, 3))).toBeLessThan(radiusOfStart(sectorPath(0, r, 0)));
    }
  });

  it('מרכז התא נופל בין שני רדיוסי הטבעת', () => {
    for (const id of cells) {
      const { r } = parse(id);
      const [x, y] = center(id);
      const rad = Math.hypot(x - 360, y - 346);
      expect(rad).toBeGreaterThan(RADII[r - 1]);
      expect(rad).toBeLessThan(RADII[r]);
    }
  });

  it('סקאלת התא חיובית ומשאירה מקום למרווח', () => {
    for (let r = 1; r <= RINGS; r++) expect(cellScale(r)).toBeGreaterThan(6);
  });

  it('התווית יושבת מחוץ לטבעת החיצונית הפעילה', () => {
    for (const outer of [3, 4, 5]) {
      const [x, y] = labelPos(0, outer);
      expect(Math.hypot(x - 360, y - 4 - 346)).toBeGreaterThan(RADII[outer]);
    }
  });
});

describe('תאורה', () => {
  it('הברק פונה למקור האור והקאוסטיקה מנוגדת לו', () => {
    for (const id of cells) {
      const L = lighting(id);
      const toSpec = [L.spec[0] - L.c[0], L.spec[1] - L.c[1]];
      const toCaus = [L.caustic[0] - L.c[0], L.caustic[1] - L.c[1]];
      // הברק באותו כיוון כמו האור
      expect(toSpec[0] * L.dir[0] + toSpec[1] * L.dir[1]).toBeGreaterThan(0);
      // הקאוסטיקה בכיוון ההפוך
      expect(toCaus[0] * L.dir[0] + toCaus[1] * L.dir[1]).toBeLessThan(0);
    }
  });

  it('כיוון האור הוא וקטור יחידה', () => {
    for (const id of cells) {
      const [dx, dy] = lighting(id).dir;
      expect(Math.hypot(dx, dy)).toBeCloseTo(1, 6);
    }
  });

  // מקור אור אחד לכל הלוח הוא מה שגורם לאבנים להיקרא כגופים באותו חלל.
  it('כל האבנים מוארות ממקור אחד — הכיוונים אינם זהים אך קרובים', () => {
    const dirs = cells.map((id) => lighting(id).dir);
    const unique = new Set(dirs.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`));
    expect(unique.size).toBeGreaterThan(30);
    // המקור נמצא מעל כל הלוח, ולכן כל אבן מוארת מלמעלה.
    // בציר האופקי הוא בתוך רוחב הלוח, ולכן הסימן של dx מתהפך — זה נכון,
    // וזה בדיוק מה שמבדיל תאורה אחת מברק זהה שהודבק על כל אבן.
    for (const [, dy] of dirs) expect(dy).toBeLessThan(0);
    expect(dirs.some(([dx]) => dx > 0)).toBe(true);
    expect(dirs.some(([dx]) => dx < 0)).toBe(true);
  });
});
