// הרמוניה — שורת ההכרזה.
// ברמות הדרכה (require) המשפחה קבועה, ולכן מכריזים על הווריאנט — איזו תבנית
// בתוך המשפחה (SPEC §5.3). ברמה 4 (opt) מכריזים על המשפחה, כפי שהיה.
import type { GameState, Family } from '../engine/types';
import { FAMILY, VARIANT } from '../data/content';

interface Props {
  G: GameState;
  onDeclare: (choice: string | Family | null) => void;
}

export function DeclareBar({ G, onDeclare }: Props) {
  if (!G.pending) return null;

  // מצב וריאנט: מציגים את הווריאנטים הפעילים של המשפחה הנדרשת
  if (G.level.require !== undefined) {
    const fam = G.level.fams[0];
    const variants = [...new Set(
      G.active.filter((h) => +h.variant[0] === fam).map((h) => h.variant),
    )].sort();
    return (
      <div id="declare" className="show">
        <span className="q">איזו תבנית של {FAMILY[fam].name} יצרת?</span>
        {variants.map((v) => (
          <button key={v} className="dbtn" onClick={() => onDeclare(v)}>
            <span className="t">{VARIANT[v]}</span>
          </button>
        ))}
      </div>
    );
  }

  // מצב משפחה (רמה 4, opt)
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
