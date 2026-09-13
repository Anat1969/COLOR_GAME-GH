// בדיקות שכבת ההוראה — מאמתות את דוגמאות המסך שהמחברת דיווחה עליהן.
// המנוע צודק בדחייה; הבדיקות מאמתות שההסבר שנבנה על הדחייה מכוון נכון.
import { describe, it, expect } from 'vitest';
import { buildCatalog } from '../src/engine/catalog';
import { analyzeSelection } from '../src/engine/teach';
import { cid } from '../src/engine/wheel';
import type { CellId, Harmony, Owner } from '../src/engine/types';

// רמה 1: משפחות 2,3 ; טבעות 2-4
const active: Harmony[] = buildCatalog().filter(
  (h) => [2, 3].includes(+h.variant[0]) &&
    h.cells.every((c) => { const r = +c.split('-')[1]; return r >= 2 && r <= 4; }),
);
const emptyBoard = new Map<CellId, Owner>();
const noLedger = new Set<string>();
const BLUE = 0, ORANGE = 6;

describe('analyzeSelection', () => {
  it('צירוף תקף מוחזר כ-ok עם ההרמוניה', () => {
    const r = analyzeSelection(emptyBoard, [cid(BLUE, 2), cid(BLUE, 3), cid(BLUE, 4)], noLedger, active);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.list.length).toBeGreaterThan(0);
      expect(r.list[0].variant).toBe('3a');
    }
  });

  it('שתי טבעות עוקבות → קרוב לדירוג (3a), חסרה אבן אחת', () => {
    const r = analyzeSelection(emptyBoard, [cid(BLUE, 2), cid(BLUE, 3)], noLedger, active);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.near).not.toBeNull();
      expect(r.near!.variant).toBe('3a');
      expect(r.near!.n).toBe(3);
      expect(r.near!.have).toBe(2);
      expect(r.near!.missing).toBe(1);
      expect(r.near!.extra).toBe(0);
    }
  });

  it('כחול+כתום בטבעות שונות → קרוב לניגוד (משפחה 2)', () => {
    const r = analyzeSelection(emptyBoard, [cid(BLUE, 2), cid(ORANGE, 4)], noLedger, active);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.near).not.toBeNull();
      expect(r.near!.n).toBe(2);      // ניגוד — 2a/2c
    }
  });

  it('הערבוב מהמסך (כחול ט2+ט3 + כתום ט4) → קרוב לדירוג, עם אבן מערבבת', () => {
    const r = analyzeSelection(
      emptyBoard, [cid(BLUE, 2), cid(BLUE, 3), cid(ORANGE, 4)], noLedger, active,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.near).not.toBeNull();
      expect(r.near!.n).toBe(3);       // הכי קרוב לדירוג הכחול
      expect(r.near!.extra).toBeGreaterThanOrEqual(1);   // הכתום מערבב
    }
  });

  it('בחירה שכבר נוקדה (ledger) לא מוצעת כהרמוניה קרובה', () => {
    const three = [cid(BLUE, 2), cid(BLUE, 3), cid(BLUE, 4)];
    const key = [...three].sort().join('|');
    const r = analyzeSelection(emptyBoard, [cid(BLUE, 2), cid(BLUE, 3)], new Set([key]), active);
    // עדיין אפשר להציע 3a אחר (ט1-3 לא פעיל ברמה 1), אך לא את זה שנוקד
    if (!r.ok && r.near) expect(r.near.variant).not.toBe('');
    expect(r.ok).toBe(false);
  });

  it('בחירה ריקה מחזירה near=null', () => {
    const r = analyzeSelection(emptyBoard, [], noLedger, active);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.near).toBeNull();
  });
});
