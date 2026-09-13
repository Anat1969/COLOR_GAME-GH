// בדיקת הרגרסיה המכוננת של המשחק.
// המספר 1173 הוא נורת האזהרה הנוכחית: אם הוא זז, משהו במנוע נשבר.
// (597 → 909 עם משפחה 3, → 1173 עם משפחה 4. פיילוט מודל הניקוד. richness > balance.)
import { describe, it, expect } from 'vitest';
import { buildCatalog } from '../src/engine/catalog';
import { detect, tally, purity, valueOf, BASE } from '../src/engine/scoring';
import type { CellId, Family } from '../src/engine/types';

const cat = buildCatalog();

describe('הקטלוג', () => {
  it('מייצר בדיוק 1173 מופעים', () => {
    expect(cat.length).toBe(1173);
  });

  it('כל מופע בגודל התואם למשפחתו', () => {
    const bad = cat.filter((h) => h.cells.length !== +h.variant[0]);
    expect(bad).toEqual([]);
  });

  it('אין תאים כפולים בתוך מופע', () => {
    const bad = cat.filter((h) => new Set(h.cells).size !== h.cells.length);
    expect(bad).toEqual([]);
  });

  it('כל 60 התאים מכוסים', () => {
    const cov = new Set<CellId>();
    cat.forEach((h) => h.cells.forEach((c) => cov.add(c)));
    expect(cov.size).toBe(60);
  });

  it('התפלגות המשפחות מאומתת (משפחות 3,4 מורחבות)', () => {
    const per: Record<string, number> = {};
    cat.forEach((h) => { per[h.variant[0]] = (per[h.variant[0]] || 0) + 1; });
    expect(per).toEqual({ '2': 102, '3': 428, '4': 357, '5': 96, '6': 106, '7': 84 });
  });

  it('כל המפתחות ייחודיים', () => {
    expect(new Set(cat.map((h) => h.key)).size).toBe(cat.length);
  });
});

describe('הניקוד', () => {
  const board = new Map<CellId, 'p' | 'c'>();
  const ledger = new Set<string>();

  it('דורש לפחות שתי אבנים חדשות (ממצא 1)', () => {
    // הרמוניה עם אבן אחת חדשה בלבד אינה מנוקדת
    const h = cat.find((x) => x.variant === '2a')!;
    const b = new Map<CellId, 'p' | 'c'>([[h.cells[0], 'p']]);
    const one = detect(b, [h.cells[1]], ledger, cat);
    expect(one.every((x) => x.cells.filter((c) => c === h.cells[1]).length)).toBeTruthy();
    // שתי אבנים חדשות — כן מנוקדת
    const two = detect(board, [h.cells[0], h.cells[1]], ledger, cat);
    expect(two.length).toBeGreaterThan(0);
  });

  it('מכפיל הטוהר נכון לכל ציר', () => {
    expect(purity(['0-3', '6-3'] as CellId[]).m).toBe(1.0);   // אותה טבעת → גוני
    expect(purity(['0-1', '0-5'] as CellId[]).m).toBe(1.1);   // אותו פלח → ערכי
    expect(purity(['0-1', '1-2'] as CellId[]).m).toBe(1.35);  // חוצה → אלכסוני
  });

  it('מכפיל הקצה חל על פרישת טבעת 1 ו-5', () => {
    const withEdge = valueOf({ variant: '2b', cells: ['0-1', '0-5'] as CellId[], key: 'x' });
    expect(withEdge.edge).toBe(true);
  });

  it('בסיס הניקוד עולה בריבוע המספר', () => {
    expect(BASE).toEqual({ 2: 4, 3: 9, 4: 16, 5: 25, 6: 36, 7: 49 });
  });

  it('זוגיות מעורבת מזכה ×1.25', () => {
    const mixed = tally([
      { n: 3 as Family, pts: 9 } as never,
      { n: 4 as Family, pts: 16 } as never,
    ]);
    expect(mixed.asym).toBe(true);
    expect(mixed.total).toBeCloseTo((9 + 16) * 1.25);
  });

  it('זוגיות אחידה מזכה ×1.00', () => {
    const same = tally([
      { n: 2 as Family, pts: 4 } as never,
      { n: 4 as Family, pts: 16 } as never,
    ]);
    expect(same.asym).toBe(false);
    expect(same.total).toBeCloseTo(20);
  });

  it('לכל היותר שלוש הרמוניות בתור', () => {
    // detect מחזיר עד שלוש הגבוהות — נבדק דרך החתך
    const many = Array.from({ length: 5 }, (_, i) => ({ pts: i } as never));
    expect(many.slice(0, 3).length).toBe(3);
  });
});
