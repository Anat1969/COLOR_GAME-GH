// הרמוניה — מקרא המשפחות.
// מלמד את הרעיון המרכזי: לכל מספר אבנים יש *צורה* של יחס. אכרומטי לגמרי —
// גליף לבן על רקע ניטרלי, כי הצבע שמור לגלגל ולוח הפרס.
import type { Family } from '../engine/types';
import { FAMILY } from '../data/content';

/** נתיב גליף מונוכרום למשפחה: קו לשניים, מצולע משוכלל לשלושה ומעלה */
function glyph(n: number): JSX.Element {
  const cx = 20, cy = 20, r = 14;
  if (n === 2) {
    return (
      <>
        <line x1={6} y1={20} x2={34} y2={20} />
        <circle cx={6} cy={20} r={3} className="node" />
        <circle cx={34} cy={20} r={3} className="node" />
      </>
    );
  }
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (-90 + (360 / n) * i) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  return (
    <>
      <path d={d} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={2.4} className="node" />)}
    </>
  );
}

export function FamiliesLegend({ fams }: { fams: Family[] }) {
  return (
    <ul className="legend" aria-label="מקרא המשפחות">
      {fams.map((n) => (
        <li key={n} className="leg-item">
          <svg className="glyph" viewBox="0 0 40 40" aria-hidden="true">{glyph(n)}</svg>
          <div className="leg-text">
            <span className="leg-name"><b>{n}</b> · {FAMILY[n].name}</span>
            <span className="leg-mean">{FAMILY[n].mean}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
