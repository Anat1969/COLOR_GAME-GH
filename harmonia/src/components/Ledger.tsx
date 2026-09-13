// הרמוניה — ספר ההרמוניות. יומן כל ההרמוניות שנמצאו במשחק.
import type { GameState } from '../engine/types';
import { FAMILY, VARIANT } from '../data/content';

export function Ledger({ G }: { G: GameState }) {
  if (!G.found.length) return <p className="empty">עוד לא נמצאה הרמוניה.</p>;
  return (
    <>
      {G.found.slice().reverse().map((f, i) => (
        <div className="row" key={i}>
          <span>{FAMILY[f.n].name} · {VARIANT[f.variant]}</span>
          <span>{Math.round(f.pts)}</span>
        </div>
      ))}
    </>
  );
}
