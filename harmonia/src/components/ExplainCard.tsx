// הרמוניה — לוח ההסבר והמשוב.
// שלושה מצבים: תצוגה מקדימה של בחירה, תוצאת מהלך מנוקד (עם תובנה),
// ומשוב "עדיין לא הרמוניה" שמכוון אל התבנית הקרובה — הסבר בלבד, בלי הארת תאים.
import type { Scored, CellId } from '../engine/types';
import type { NearMiss } from '../engine/teach';
import { FAMILY, VARIANT, LAW, FX_LABEL } from '../data/content';
import { DIST, AXES, SYM } from '../engine/factors';
import { parse, SEG_NAMES_HE } from '../engine/wheel';

/** שמות האבנים בצירוף, לפי סדר פלח ואז טבעת */
function stoneNames(cells: CellId[]): string {
  return [...cells]
    .sort((a, b) => { const pa = parse(a), pb = parse(b); return pa.s - pb.s || pa.r - pb.r; })
    .map((c) => { const { s, r } = parse(c); return `${SEG_NAMES_HE[s]} ט${r}`; })
    .join(', ');
}

/** שורת המכפילים של הרמוניה — מודל הגורמים (distance/axes/symmetry) או טוהר/קצה הקלאסי */
export function multLine(f: Scored): string {
  if (f.fx) {
    const d = `${FX_LABEL.distance[f.fx.distance]} ×${DIST[f.fx.distance].toFixed(2)}`;
    const a = `${FX_LABEL.axes[f.fx.axes]} ×${AXES[f.fx.axes].toFixed(2)}`;
    const s = `${FX_LABEL.symmetry[f.fx.symmetry]} ×${SYM[f.fx.symmetry].toFixed(2)}`;
    return `${d} · ${a} · ${s}`;
  }
  return `${f.purity.label} ×${f.purity.m.toFixed(2)}${f.edge ? ' · קצה ×1.10' : ''}`;
}

export interface Explain {
  preview?: boolean;
  none?: boolean;
  head?: string;
  note?: string;
  list: Scored[];
  asym?: boolean;
  total?: number;
  near?: NearMiss | null;   // משוב על בחירה שאינה תקפה
  size?: { need: number; have: number };   // רמת הדרכה: אורך צירוף נדרש
  committed?: boolean;      // מהלך שהונח בפועל — מציג תובנה
  placed?: CellId[];        // האבנים שהונחו — לכותרת הפירוק
}

/** מרכיב את הסבר ה-near-miss מהמבנה הטהור של teach.ts */
function nearText(near: NearMiss): string {
  const fam = FAMILY[near.n].name;
  const vname = VARIANT[near.variant];
  const law = LAW[near.variant];
  if (near.extra > 0 && near.have >= 2) {
    return `הבחירה מערבבת יותר מיחס אחד. הקרובה ביותר: ${fam} · ${vname} — ${law}. ` +
      `יש בבחירה ${near.extra} אבנים שאינן חלק ממנה.`;
  }
  if (near.missing >= 1) {
    const n = near.missing;
    const gap = n === 1 ? 'חסרה עוד אבן אחת' : `חסרות עוד ${n} אבנים`;
    return `קרובה ל${fam} · ${vname} — ${law}. ${gap}.`;
  }
  return `קרובה ל${fam} · ${vname} — ${law}.`;
}

export function ExplainCard({ x }: { x: Explain | null }) {
  if (!x) return <p className="empty">בחרי אבנים מהמגש כדי להתחיל.</p>;

  // משוב: לא הרמוניה — אבל מכוונים
  if (x.none) {
    const wrongSize = x.size && x.size.have !== x.size.need;
    return (
      <div className="feedback">
        <p className="fb-title">הצירוף עדיין אינו הרמוניה</p>
        {wrongSize
          ? <p className="fb-body">
              ברמה זו כל מהלך הוא בדיוק {x.size!.need} אבנים שיוצרות יחד הרמוניה אחת.
              יש לך {x.size!.have}.
            </p>
          : x.near
            ? <p className="fb-body">{nearText(x.near)}</p>
            : <p className="fb-body">נסי צירוף אחר — יחס גיאומטרי אחד נקי.</p>}
      </div>
    );
  }

  const sum = x.total ?? x.list.reduce((a, f) => a + f.pts, 0);
  return (
    <>
      {x.preview && <p className="empty" style={{ marginBottom: 12 }}>תצוגה מקדימה — לחצי "סיום הבחירה" לניקוד</p>}
      {x.head && <p className="empty" style={{ marginBottom: 12 }}>{x.head}</p>}

      {/* פירוק: הצירוף השלם שהונח, ומה תרם כל רכיב בתוכו */}
      {x.placed && x.placed.length > 0 && (
        <p className="combo-head">
          הצירוף שהנחת: {stoneNames(x.placed)}
          {x.list.length > 0 && (
            <> · {x.list.length === 1 ? 'קומפוזיציה אחת' : `${x.list.length} קומפוזיציות`}</>
          )}
        </p>
      )}

      {x.list.map((f, i) => (
        <div className="card" key={i}>
          <div className="h">
            <span className="name">{FAMILY[f.n].name} · {VARIANT[f.variant]}</span>
            <span className="pts">{Math.round(f.pts)}</span>
          </div>
          <div className="law">{LAW[f.variant]}</div>
          <div className="mean">{FAMILY[f.n].mean}</div>
          <div className="mult">{multLine(f)}</div>
        </div>
      ))}

      {x.list.length > 1 && (
        <div className="row">
          <span>{x.asym ? 'זוגיות מעורבת ×1.25' : 'זוגיות אחידה ×1.00'}</span>
          <span>{Math.round(x.total ?? 0)}</span>
        </div>
      )}

      {/* שורת סיכום — הניקוד הכולל של הצירוף */}
      {(x.committed || x.preview) && x.list.length > 0 && (
        <div className="row total">
          <span>סה״כ הצירוף</span>
          <span>{Math.round(sum)}</span>
        </div>
      )}

      {x.note && <p className="empty" style={{ marginTop: 12 }}>{x.note}</p>}
    </>
  );
}
