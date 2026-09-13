// הרמוניה — פאנל "הצירוף הטוב ביותר שאפשר היה".
// כלי ההוראה המרכזי של מצב ההדרכה: מראה לא רק מה עשית אלא מה יכולת לראות.
// הצירוף המיטבי חושב ב-bestMove תחת חוקי הרמה (בדיוק N אבנים, משפחה N).
import type { Move } from '../engine/types';
import { FAMILY, VARIANT } from '../data/content';

interface Props { best: Move; actualPts: number; }

export function BestMove({ best, actualPts }: Props) {
  const bestPts = Math.round(best.total);
  const diff = Math.round(best.total - actualPts);
  const optimal = diff <= 0;

  return (
    <div className="bestmove">
      {optimal ? (
        <p className="bm-optimal">זה היה המהלך המיטבי מהיד שהיתה לך.</p>
      ) : (
        <>
          <p className="bm-lead">
            הצירוף הטוב ביותר שאפשר היה: <b>{bestPts}</b> נק׳ · החמצת {diff}
          </p>
          {best.list.map((h, i) => (
            <div className="bm-row" key={i}>
              <span>{FAMILY[h.n].name} · {VARIANT[h.variant]}</span>
              <span>{Math.round(h.pts)}</span>
            </div>
          ))}
          <p className="bm-hint">הצורה המקווקוה על הגלגל מסמנת איפה היה.</p>
        </>
      )}
    </div>
  );
}
