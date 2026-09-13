// רמות ההדרכה (1–3) — משפחה יחידה, מהלך = בדיוק N אבנים.
import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/data/content';
import { newGame } from '../src/engine/reducer';
import { teachingMove, analyzeSelection } from '../src/engine/teach';
import { bestMove } from '../src/engine/ai';
import { cid } from '../src/engine/wheel';
import type { CellId, Owner } from '../src/engine/types';

const board = new Map<CellId, Owner>();
const noLedger = new Set<string>();

describe('חוקי מצב ההדרכה', () => {
  it('רמות 1–3 דורשות 3/4/5 אבנים וממשפחה יחידה', () => {
    expect(LEVELS[0].require).toBe(3);
    expect(LEVELS[0].fams).toEqual([3]);
    expect(LEVELS[1].require).toBe(4);
    expect(LEVELS[1].fams).toEqual([4]);
    expect(LEVELS[2].require).toBe(5);
    expect(LEVELS[2].fams).toEqual([5]);
  });

  it('רמות 4–5 ללא require (התנהגות קיימת)', () => {
    expect(LEVELS[3].require).toBeUndefined();
    expect(LEVELS[4].require).toBeUndefined();
  });

  it('teachingMove מזהה צירוף של 3 שהוא הרמוניית משפחה 3', () => {
    const G = newGame(0);                       // רמה 1: fams [3], טבעות 2-4
    const trio = [cid(0, 3), cid(1, 3), cid(2, 3)];   // דירוג גוני בטבעת 3
    const h = teachingMove(trio, 3, noLedger, G.active);
    expect(h).not.toBeNull();
    expect(h!.cells.length).toBe(3);
    expect(+h!.variant[0]).toBe(3);
  });

  it('teachingMove דוחה מספר אבנים שגוי', () => {
    const G = newGame(0);
    expect(teachingMove([cid(0, 3), cid(1, 3)], 3, noLedger, G.active)).toBeNull();       // 2
    expect(teachingMove([cid(0, 3), cid(1, 3), cid(2, 3), cid(3, 3)], 3, noLedger, G.active)).toBeNull(); // 4
  });

  it('teachingMove דוחה צירוף שאינו הרמוניה', () => {
    const G = newGame(0);
    // שלושה תאים שאינם תבנית משפחה-3 חוקית (טבעות מעורבות ללא רצף)
    const junk = [cid(0, 2), cid(3, 4), cid(7, 3)];
    expect(teachingMove(junk, 3, noLedger, G.active)).toBeNull();
  });

  it('analyzeSelection עם require: ok לצירוף מדויק, size למספר שגוי', () => {
    const G = newGame(0);
    const trio = [cid(0, 3), cid(1, 3), cid(2, 3)];
    const good = analyzeSelection(board, trio, noLedger, G.active, 3);
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.list[0].n).toBe(3);

    const short = analyzeSelection(board, [cid(0, 3), cid(1, 3)], noLedger, G.active, 3);
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.size).toEqual({ need: 3, have: 2 });
  });

  it('bestMove עם exactSize מחזיר מהלך בדיוק בגודל הנדרש, משפחה N', () => {
    const G = newGame(0);                        // רמה 1: fams [3]
    // יד עם דירוג גוני בטבעת 3 + מסיחים
    G.hand = [cid(0, 3), cid(1, 3), cid(2, 3), cid(5, 2), cid(8, 4)];
    const mv = bestMove(G, G.hand, 'תכנן', 3);
    expect(mv).not.toBeNull();
    expect(mv!.sel.length).toBe(3);
    expect(mv!.list[0].n).toBe(3);
  });

  it('בלי require — התנהגות רגילה נשמרת (רמות גבוהות)', () => {
    const G = newGame(3);                        // רמה 4: ריבוי משפחות, ללא require
    const pair = [cid(0, 3), cid(6, 3)];          // ניגוד משלים (משפחה 2)
    const r = analyzeSelection(board, pair, noLedger, G.active);
    expect(r.ok).toBe(true);
  });
});
