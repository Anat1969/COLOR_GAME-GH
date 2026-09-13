// הרמוניה — מכונת המצבים. פונקציות טהורות שמקבלות מצב ומחזירות מצב חדש.
// ה-UI קורא לאלה; אין כאן שום תלות ב-React.
import type { CellId, GameState, Owner, Scored } from './types';
import { CATALOG } from './catalog';
import { cid, parse, SEGS, SEG_NAMES } from './wheel';
import { detect, tally } from './scoring';
import { LEVELS, FAMILY } from '../data/content';

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newGame(levelIdx: number): GameState {
  const level = LEVELS[levelIdx];
  const cells: CellId[] = [];
  for (let s = 0; s < SEGS; s++) for (const r of level.rings) cells.push(cid(s, r));
  const cs = new Set(cells);
  const active = CATALOG.filter(
    (h) => level.fams.includes(+h.variant[0] as never) && h.cells.every((c) => cs.has(c)),
  );
  const pot = shuffle(cells.slice());
  const hand: CellId[] = [];
  const cpu: CellId[] = [];
  // מצב סולו (רמה 1): אין יריב — כל האבנים זמינות לשחקנית, לא מחלקים למחשב.
  for (let i = 0; i < level.hand; i++) {
    if (pot.length) hand.push(pot.pop()!);
    if (!level.solo && pot.length) cpu.push(pot.pop()!);
  }
  return {
    level, levelIdx, cells, active,
    board: new Map(), pot, hand, cpu, ledger: new Set(), sel: new Set(),
    score: { p: 0, c: 0 }, found: [], log: [], over: false, busy: false,
    pending: null, passes: 0,
    stat: { declTotal: 0, declOk: 0, byFam: {}, turns: 0, stones: 0, asym: 0, diag: 0, harm: 0 },
  };
}

/** בונוסים של עמוד שלם וטבעת שלמה, נרשמים פעם אחת בספר */
export function checkBonuses(G: GameState, who: Owner): void {
  for (let s = 0; s < SEGS; s++) {
    const col = G.cells.filter((c) => parse(c).s === s);
    if (col.length >= 3 && col.every((c) => G.board.has(c)) && !G.ledger.has('col' + s)) {
      G.ledger.add('col' + s);
      G.score[who] += 20;
      G.log.push(`<b>${who === 'p' ? 'את' : 'המחשב'}</b> — עמוד שלם ${SEG_NAMES[s]} · 20`);
    }
  }
  for (const r of G.level.rings) {
    const ring = G.cells.filter((c) => parse(c).r === r);
    if (ring.every((c) => G.board.has(c)) && !G.ledger.has('ring' + r)) {
      G.ledger.add('ring' + r);
      G.score[who] += 80;
      G.log.push(`<b>${who === 'p' ? 'את' : 'המחשב'}</b> — טבעת שלמה ${r} · 80`);
    }
  }
}

/** מבצע הנחת אבנים ומעדכן מצב וסטטיסטיקה. מחזיר את הניקוד שנוסף. */
export function applyPlacement(
  G: GameState, sel: CellId[], list: Scored[], who: Owner, mult = 1.0,
): number {
  const t = tally(list);
  const pts = t.total * mult;
  const target = who === 'p' ? G.hand : G.cpu;
  for (const c of sel) {
    G.board.set(c, who);
    target.splice(target.indexOf(c), 1);
  }
  for (const f of list) G.ledger.add(f.key);
  G.found.push(...list);
  G.score[who] += pts;
  if (who === 'p') {
    G.stat.turns++;
    G.stat.stones += sel.length;
    G.stat.harm += list.length;
    if (t.asym) G.stat.asym++;
    G.stat.diag += list.filter((f) => f.purity.kind === 'diagonal').length;
  }
  if (sel.length === G.level.hand) G.score[who] += 50;   // קומפוזיציה — כל היד בתור אחד
  checkBonuses(G, who);
  G.log.push(
    `<b>${who === 'p' ? 'את' : 'המחשב'}</b> — ${list.map((f) => FAMILY[f.n].name).join(', ')} · ${Math.round(pts)}`,
  );
  G.passes = 0;
  while (target.length < G.level.hand && G.pot.length) target.push(G.pot.pop()!);
  return pts;
}

export function isGameOver(G: GameState): boolean {
  // סולו: נגמר כשהשחקנית מיצתה את היד והקופה (cpu ריק תמיד, ולכן לא נספר).
  if (G.level.solo) return G.hand.length === 0 && G.pot.length === 0;
  const handEmpty = (G.hand.length === 0 || G.cpu.length === 0) && G.pot.length === 0;
  const stuck = G.passes >= 2 && G.pot.length === 0;
  return handEmpty || stuck;
}

/** קנס סיום: 3 × אבנים שנותרו ביד */
export function applyEndPenalty(G: GameState): void {
  G.score.p -= 3 * G.hand.length;
  G.score.c -= 3 * G.cpu.length;
  G.over = true;
}

// ייצוא לנוחות ה-UI
export { detect, tally, LEVELS };
