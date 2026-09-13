// הרמוניה — היריב הממוחשב.
// שלוש הדרגות חמדניות ביסודן. ראו CLAUDE.md ממצא 4:
// היוריסטיקת חסימה נבדקה ונכשלה — כשההרמוניות ממאגר משותף,
// לקיחת ערך היא כשלעצמה שלילת ערך. אל תוסיף חסימה בלי מדידה.
import type { CellId, Move, GameState, AiStyle } from './types';
import { detect, tally } from './scoring';

/** כל תת-הקבוצות בגודל 2..max */
function subsets(arr: CellId[], max: number): CellId[][] {
  const out: CellId[][] = [];
  const n = arr.length;
  for (let m = 1; m < 1 << n; m++) {
    const p: CellId[] = [];
    for (let i = 0; i < n; i++) if (m & (1 << i)) p.push(arr[i]);
    if (p.length >= 2 && p.length <= max) out.push(p);
  }
  return out;
}

export function bestMove(
  G: GameState, hand: CellId[], style: AiStyle, exactSize?: number,
): Move | null {
  const opts: Move[] = [];
  for (const sub of subsets(hand, exactSize ?? 6)) {
    if (exactSize !== undefined && sub.length !== exactSize) continue;
    let list = detect(G.board, sub, G.ledger, G.active);
    // רמת הדרכה: רק צירוף שהוא בעצמו הרמוניה שלמה באורך הנדרש
    if (exactSize !== undefined) {
      const subSet = new Set(sub);
      list = list.filter((h) => h.cells.length === exactSize && h.cells.every((c) => subSet.has(c)));
    }
    if (!list.length) continue;
    const t = tally(list);
    let v = t.total;
    // "הלחן": בסוף המשחק (קופה < 25) מעודד פינוי יד גדול — היחיד שנמדד כמשפר
    if (style === 'הלחן' && G.pot.length < 25) v += 30 * sub.length;
    opts.push({ sel: sub, list, total: t.total, v });
  }
  if (!opts.length) return null;
  opts.sort((a, b) => b.v - a.v);

  // "למד": בחירה מהחציון העליון, העדפת הרמוניות קצרות — משחק נגיש ומדגים
  if (style === 'למד') {
    const half = opts.slice(Math.floor(opts.length / 2));
    const short = half.filter((o) => o.list[0].n <= 3);
    const pool = short.length ? short : half;
    return pool[(Math.random() * pool.length) | 0];
  }
  return opts[0];
}
