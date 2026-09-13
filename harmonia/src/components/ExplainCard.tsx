// הרמוניה — לוח ההסבר. מציג את החוק, המשמעות והמכפילים של המהלך.
import type { Scored } from '../engine/types';
import { FAMILY, VARIANT, LAW } from '../data/content';

export interface Explain {
  preview?: boolean; none?: boolean; head?: string; note?: string;
  list: Scored[]; asym?: boolean; total?: number;
}

export function ExplainCard({ x }: { x: Explain | null }) {
  if (!x) return <p className="empty">בחרי אבנים מהמגש.</p>;
  if (x.none) return <p className="empty">הצירוף הזה אינו יוצר הרמוניה. נסי צירוף אחר.</p>;
  return (
    <>
      {x.preview && <p className="empty" style={{ marginBottom: 12 }}>תצוגה מקדימה</p>}
      {x.head && <p className="empty" style={{ marginBottom: 12 }}>{x.head}</p>}
      {x.list.map((f, i) => (
        <div className="card" key={i}>
          <div className="h">
            <span className="name">{FAMILY[f.n].name} · {VARIANT[f.variant]}</span>
            <span className="pts">{Math.round(f.pts)}</span>
          </div>
          <div className="law">{LAW[f.variant]}</div>
          <div className="mean">{FAMILY[f.n].mean}</div>
          <div className="mult">
            {f.purity.label} ×{f.purity.m.toFixed(2)}{f.edge && ' · קצה ×1.10'}
          </div>
        </div>
      ))}
      {x.list.length > 1 && (
        <div className="row">
          <span>{x.asym ? 'זוגיות מעורבת ×1.25' : 'זוגיות אחידה ×1.00'}</span>
          <span>{Math.round(x.total ?? 0)}</span>
        </div>
      )}
      {x.note && <p className="empty" style={{ marginTop: 12 }}>{x.note}</p>}
    </>
  );
}
