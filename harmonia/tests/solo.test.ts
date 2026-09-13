// מצב סולו (רמה 1) — אין יריב, ותנאי הסיום תלוי רק בשחקנית.
import { describe, it, expect } from 'vitest';
import { newGame, isGameOver } from '../src/engine/reducer';
import { LEVELS } from '../src/data/content';

describe('מצב סולו — רמה 1', () => {
  it('רמה 1 מסומנת solo; רמות 2+ אינן', () => {
    expect(LEVELS[0].solo).toBe(true);
    expect(LEVELS[1].solo).toBeFalsy();
  });

  it('בסולו לא מחלקים אבנים למחשב', () => {
    const G = newGame(0);
    expect(G.level.solo).toBe(true);
    expect(G.cpu.length).toBe(0);
    expect(G.hand.length).toBe(G.level.hand);
  });

  it('ברמה עם יריב כן מחלקים למחשב', () => {
    const G = newGame(1);
    expect(G.cpu.length).toBe(G.level.hand);
  });

  it('סיום סולו תלוי רק ביד ובקופה — לא ב-cpu הריק', () => {
    const G = newGame(0);
    // עדיין יש אבנים ביד/בקופה → לא נגמר, למרות ש-cpu ריק
    expect(isGameOver(G)).toBe(false);
    // רוקנו הכול
    G.hand = [];
    G.pot = [];
    expect(isGameOver(G)).toBe(true);
  });

  it('ביד לא ריקה וקופה ריקה — סולו עדיין לא נגמר', () => {
    const G = newGame(0);
    G.pot = [];
    expect(G.hand.length).toBeGreaterThan(0);
    expect(isGameOver(G)).toBe(false);   // בניגוד למצב יריב, יד לא ריקה ממשיכה
  });
});
