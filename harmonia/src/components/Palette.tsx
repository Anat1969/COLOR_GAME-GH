// הרמוניה — לוח הפרס.
// התגמול הוויזואלי היחיד עם צבע: אחרי בחירה מוצלחת, גווני ההרמוניה מוצגים
// כדוגמיות גדולות — לוח הצבעים שהשחקנית *יצרה* — עם שם היחס, החוק והתובנה.
// זהו החריג המכוון לעיקרון האכרומטי (אושר ע"י המחברת).
import type { Scored, CellId } from '../engine/types';
import { hexOf, parse, SEG_NAMES_HE } from '../engine/wheel';
import { FAMILY, VARIANT, LAW } from '../data/content';

/** מסדר את תאי ההרמוניה לקריאה: לפי פלח ואז טבעת */
const ordered = (cells: CellId[]): CellId[] =>
  [...cells].sort((a, b) => {
    const pa = parse(a), pb = parse(b);
    return pa.s - pb.s || pa.r - pb.r;
  });

export function Palette({ list }: { list: Scored[] }) {
  if (!list.length) return null;
  return (
    <div className="palettes">
      {list.map((h, i) => (
        <div className="palette" key={i}>
          <div className="pal-head">
            <span className="pal-name">{FAMILY[h.n].name} · {VARIANT[h.variant]}</span>
            <span className="pal-pts num">{Math.round(h.pts)}</span>
          </div>

          <div className="swatches" role="img"
            aria-label={`לוח צבעים: ${FAMILY[h.n].name}, ${VARIANT[h.variant]}`}>
            {ordered(h.cells).map((id) => {
              const { s, r } = parse(id);
              return (
                <div className="swatch" key={id} style={{ background: hexOf(id) }}>
                  <span className="sw-label">{SEG_NAMES_HE[s]}<br />ט{r}</span>
                </div>
              );
            })}
          </div>

          <div className="pal-law">{LAW[h.variant]}</div>
          <div className="pal-mean">{FAMILY[h.n].mean}</div>
          <div className="pal-mult">
            {h.purity.label} ×{h.purity.m.toFixed(2)}{h.edge && ' · קצה ×1.10'}
          </div>
        </div>
      ))}
    </div>
  );
}
