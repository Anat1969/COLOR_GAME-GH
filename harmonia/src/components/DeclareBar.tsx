// הרמוניה — שורת ההכרזה. השחקן נוקב במשפחת ההרמוניה לפני אישור.
import type { GameState, Family } from '../engine/types';
import { FAMILY } from '../data/content';

interface Props { G: GameState; onDeclare: (n: Family | null) => void; }

export function DeclareBar({ G, onDeclare }: Props) {
  if (!G.pending) return null;
  return (
    <div id="declare" className="show">
      <span className="q">איזו הרמוניה יצרת?</span>
      {G.level.fams.map((n) => (
        <button key={n} className="dbtn" onClick={() => onDeclare(n)}>
          <span className="n">{n}</span>
          <span className="t">{FAMILY[n].name}</span>
        </button>
      ))}
      {G.level.declare === 'opt' && (
        <button className="dbtn" onClick={() => onDeclare(null)}>
          <span className="t">ויתור על הכרזה<br />60% ניקוד</span>
        </button>
      )}
    </div>
  );
}
