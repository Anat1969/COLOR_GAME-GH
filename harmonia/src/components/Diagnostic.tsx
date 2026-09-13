// הרמוניה — לוח האבחון בסיום.
// לא "ניצחת/הפסדת" אלא איפה העין חזקה ואיפה היא עוד לא רואה.
// הניקוד הוא המנגנון; המיומנות היא התוצר (SPEC §10).
import type { GameState } from '../engine/types';
import { LEVELS, FAMILY } from '../data/content';

interface Props { G: GameState; unlocked: number; onPick: (levelIdx: number) => void; }

export function Diagnostic({ G, unlocked, onPick }: Props) {
  const s = G.stat;
  const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
  const rows: [string, number, string][] = [
    ['זיהוי יחס — דיוק הכרזה', pct(s.declOk, s.declTotal),
      'האם נקבת נכון במשפחה שיצרת'],
    ['ראיית קבוצה — אבנים לתור', Math.min(100, Math.round((100 * (s.stones / Math.max(1, s.turns))) / 4)),
      'האם ראית קבוצה לפני שהייתה קיימת'],
    ['שקילת זוגיות — תורות במכפיל', pct(s.asym, s.turns),
      'האם שילבת משפחות זוגיות ואי־זוגיות'],
    ['חציית שני הצירים — אלכסוניות', pct(s.diag, Math.max(1, s.harm)),
      'האם חצית גוון וערך בו־זמנית'],
  ];
  const won = G.score.p > G.score.c;
  const nextIdx = G.levelIdx + 1;
  const opened = won && nextIdx < LEVELS.length && nextIdx <= unlocked;

  // דיוק לפי משפחה — מראה איזו משפחה עוד לא נקראת נכון
  const fams = Object.entries(s.byFam)
    .map(([n, v]) => [+n, v] as const)
    .filter(([, v]) => v.all > 0)
    .sort((a, b) => a[0] - b[0]);

  return (
    <div className="panel" role="dialog" aria-modal="true" aria-label="לוח האבחון">
      <h2>{won ? 'ניצחת' : 'המחשב ניצח'}</h2>
      <p>
        {Math.round(G.score.p)} מול {Math.round(G.score.c)} · {s.turns} תורות ·{' '}
        {G.found.length} הרמוניות
      </p>

      <div className="bars">
        {rows.map(([label, v, why]) => (
          <div className="brow" key={label}>
            <span>{label}<br /><span className="empty">{why}</span></span>
            <div className="track"><div className="fill" style={{ width: `${v}%` }} /></div>
            <span className="p">{v}</span>
          </div>
        ))}
      </div>

      {fams.length > 0 && (
        <>
          <h3 style={{ color: 'var(--dim)', fontWeight: 400, marginBottom: 12 }}>
            דיוק ההכרזה לפי משפחה
          </h3>
          <div className="bars">
            {fams.map(([n, v]) => (
              <div className="row" key={n}>
                <span>{n} · {FAMILY[n].name}</span>
                <span>{pct(v.ok, v.all)}% · {v.ok}/{v.all}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p>{opened ? 'הרמה הבאה נפתחה.' : 'אפשר לשחק שוב או לבחור רמה.'}</p>
      <div className="lvls">
        {LEVELS.map((L, i) => (
          <button
            key={L.n}
            className={i === (opened ? nextIdx : G.levelIdx) ? 'primary' : ''}
            disabled={i > unlocked}
            onClick={() => onPick(i)}
          >
            רמה {L.n} · {L.name}
          </button>
        ))}
      </div>
    </div>
  );
}
