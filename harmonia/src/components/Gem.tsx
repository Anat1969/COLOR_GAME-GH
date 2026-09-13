// הרמוניה — אבן הזכוכית.
//
// אבן נבנית משכבות, לא ממילוי אחד. כל שכבה נושאת רמז פיזיקלי אחד, ויחד
// הן נקראות כגוף שקוף בעל נפח:
//
//   שקע      — החלל הכהה בלוח. נראה מבעד לזכוכית ונותן לה עומק.
//   צל       — האבן מוטלת על הלוח, לא מודבקת עליו.
//   גוף      — הצבע האמיתי, כהה ורווי. זה מה שרואים דרך הזכוכית העבה בשוליים.
//   כיפה     — מפל אור מהצד המואר: המשטח קמור.
//   בליעת קצה — הזכוכית עבה יותר בשוליים ולכן כהה ורוויה יותר שם.
//   קאוסטיקה — האור עבר דרך הגוף והתמקד בצד הנגדי. זה הרמז שאומר "שקוף".
//   ברק      — ההחזר החד מהמשטח. חד בכוונה — חדות היא מה שקורא כזכוכית.
//   שפה      — קו אור על הדופן הפונה לאור, וכהה על הנגדית.
//
// הכל וקטורי: אין פילטר רסטר לאבן, ולכן היא נשארת חדה בכל הגדלה, וששים
// אבנים עולות פחות ממחיר פילטר אחד לכל אבן.
import { memo } from 'react';
import type { CellId } from '../engine/types';
import { css, hslOf, lighting, parse, sectorPath, shift } from '../engine/wheel';

/** מרווח בין אבן לשכנתה */
export const PAD = 2.6;
/**
 * רדיוס הפינות. מושג בטריק: מציירים נתיב מכווץ ב-RR ומקיפים אותו בקו
 * ברוחב 2·RR עם חיבור מעוגל — התוצאה היא הצורה המקורית עם פינות מעוגלות.
 * ההשלכה החשובה: גבול האבן הנראה נמצא RR *מחוץ* לנתיב `d`. לכן כל קו
 * שאמור לשבת על השפה חייב להיות קו ברוחב 2·RR על `d` — לא קו דק עליו,
 * שהיה נראה כמסגרת מצוירת בתוך האבן.
 */
export const RR = 3.2;

/** צורת האבן, עם פינות מעוגלות. מצויר כמילוי + קו מתאר באותו צבע. */
function Facet(
  { d, paint, opacity, className }:
  { d: string; paint: string; opacity?: number; className?: string },
) {
  return (
    <path
      className={className} d={d} fill={paint} stroke={paint}
      strokeWidth={RR * 2} strokeLinejoin="round" opacity={opacity}
    />
  );
}

/** נתיב האבן עבור תא — מיוצא כדי שהשקע והצל יחלקו אותו בדיוק */
export const gemPath = (s: number, r: number): string =>
  sectorPath(s, r, PAD + RR);

/* ------------------------------------------------------------------ */

/** השקע בלוח — נחצב פעם אחת לכל תא פעיל, גם כשהוא ריק */
export const Socket = memo(function Socket({ id }: { id: CellId }) {
  const { s, r } = parse(id);
  const d = gemPath(s, r);
  return (
    <>
      <Facet d={d} paint="#212125" />
      <path
        d={d} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth={2.4}
        strokeLinejoin="round"
      />
    </>
  );
});

/** רמז הגוון בתא ריק — כבוי, עד שהאבן תונח */
export const Ghost = memo(function Ghost(
  { id, lit }: { id: CellId; lit: 'off' | 'hover' | 'sel' },
) {
  const { s, r } = parse(id);
  const c = hslOf(id);
  const d = gemPath(s, r);
  const o = lit === 'sel' ? 0.5 : lit === 'hover' ? 0.3 : 0.1;
  return (
    <>
      <Facet d={d} paint={css(c)} opacity={o} className={lit === 'sel' ? 'ghost-sel' : undefined} />
      {lit !== 'off' && (
        <path
          d={d} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth={1.6}
          strokeLinejoin="round" strokeDasharray={lit === 'sel' ? undefined : '5 4'}
        />
      )}
    </>
  );
});

/* ------------------------------------------------------------------ */

interface StoneProps {
  id: CellId;
  /** מי הניח — קובע את עוצמת קו הבעלות בלבד, לא את הצבע */
  owner: 'p' | 'c';
}

/** האבן עצמה. ממואיזציה: הצורה תלויה רק ב-id ובבעלות, ואינה משתנה בין תורות. */
export const Stone = memo(function Stone({ id, owner }: StoneProps) {
  const { s, r } = parse(id);
  const c = hslOf(id);
  const L = lighting(id);
  const d = gemPath(s, r);
  const uid = `g${s}_${r}`;

  // הגוף נושא את הצבע הנקוב עצמו; המודלציה נעה סביבו לשני הכיוונים,
  // כך שהממוצע הנתפס של האבן נשאר נאמן לגלגל הייחוס.
  const domeHi = shift(c, +26, -10);
  const domeFar = shift(c, -16, +10);
  const causticC = shift(c, +30, +18);
  const edgeDark = shift(c, -26, +14);
  const rimWarm = shift(c, +34, +6);

  const [hx, hy] = L.hi;
  const [sx, sy] = L.spec;
  const [qx, qy] = L.caustic;
  const [cx0, cy0] = L.c;
  const [dx, dy] = L.dir;
  const k = L.k;

  return (
    <g className="stone">
      <defs>
        {/* הכיפה — מפל מהמוקד המואר אל השוליים. אטום לכל אורכו:
            שקיפות חלקית כאן החזירה את הגוף הכהה והעכירה את הגוון. */}
        <radialGradient id={`dome-${uid}`} gradientUnits="userSpaceOnUse"
          cx={hx} cy={hy} r={k * 1.7}>
          <stop offset="0" stopColor={css(domeHi)} />
          <stop offset=".38" stopColor={css(c)} />
          <stop offset="1" stopColor={css(domeFar)} />
        </radialGradient>

        {/* קאוסטיקה — האור שעבר דרך הגוף והתמקד מעבר */}
        <radialGradient id={`caus-${uid}`} gradientUnits="userSpaceOnUse"
          cx={qx} cy={qy} r={k * 0.92}>
          <stop offset="0" stopColor={css(causticC)} stopOpacity=".62" />
          <stop offset=".55" stopColor={css(causticC)} stopOpacity=".20" />
          <stop offset="1" stopColor={css(causticC)} stopOpacity="0" />
        </radialGradient>

        {/* הברק */}
        <radialGradient id={`spec-${uid}`} gradientUnits="userSpaceOnUse"
          cx={sx} cy={sy} r={k * 0.62}>
          <stop offset="0" stopColor="#fff" stopOpacity=".88" />
          <stop offset=".38" stopColor="#fff" stopOpacity=".34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>

        {/* השפה. בהירות דו־שיאית לאורך ציר האור, וזו הנקודה שמוכרת זכוכית:
            בצד הפונה לאור — החזר לבן חד. בצד הנגדי — האור *יוצא* מבעד
            לדופן הקמורה, ולכן שם זוהר צבוע בגוון האבן, לא לבן. בין שני
            השיאים השפה כהה. מסגרת בהירה אחידה הייתה נקראת כמדבקה. */}
        <linearGradient id={`rim-${uid}`} gradientUnits="userSpaceOnUse"
          x1={cx0 + dx * k} y1={cy0 + dy * k} x2={cx0 - dx * k} y2={cy0 - dy * k}>
          <stop offset="0" stopColor="#fff" stopOpacity=".92" />
          <stop offset=".20" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".44" stopColor="#000" stopOpacity=".26" />
          <stop offset=".70" stopColor="#000" stopOpacity=".20" />
          <stop offset=".89" stopColor={css(rimWarm)} stopOpacity=".62" />
          <stop offset="1" stopColor={css(rimWarm)} stopOpacity=".80" />
        </linearGradient>

        <clipPath id={`clip-${uid}`}>
          <path d={d} stroke="none" />
          {/* הקו המעוגל אינו נכלל ב-clip, ולכן נוסף שוב ככתם מלא */}
          <path d={d} fill="none" stroke="#000" strokeWidth={RR * 2} strokeLinejoin="round" />
        </clipPath>
      </defs>

      {/* קו המגע — מפריד את האבן מדופן השקע */}
      <path
        d={d} fill="none" stroke="#0B0B0D" strokeWidth={RR * 2 + 1.8}
        strokeLinejoin="round" opacity={0.75}
      />

      {/* גוף */}
      <Facet d={d} paint={css(c)} />

      {/* כל המודלציה חתוכה לגבול האבן */}
      <g clipPath={`url(#clip-${uid})`}>
        <Facet d={d} paint={`url(#dome-${uid})`} />

        {/* בליעת קצה — הזכוכית עבה יותר בשוליים, ולכן כהה ורוויה יותר */}
        <path
          d={d} fill="none" stroke={css(edgeDark)} strokeWidth={RR * 2}
          strokeLinejoin="round" opacity={0.85}
        />
        <path
          d={sectorPath(s, r, PAD + RR + 2.5)} fill="none" stroke={css(edgeDark)}
          strokeWidth={7} strokeLinejoin="round" opacity={0.42} filter="url(#soften)"
        />

        <Facet d={d} paint={`url(#caus-${uid})`} />

        {/* השפה בשתי שכבות. קו יחיד ברוחב 2·RR היה נקרא כמסגרת לבנה עבה;
            השפה האמיתית חדה ודקה, ומתחתיה נפילה רכה פנימה. */}
        <path
          d={sectorPath(s, r, PAD + 1.4)} fill="none" stroke={`url(#rim-${uid})`}
          strokeWidth={4.5} strokeLinejoin="round" opacity={0.38}
          filter="url(#soften)"
        />
        <path
          d={sectorPath(s, r, PAD + 0.9)} fill="none" stroke={`url(#rim-${uid})`}
          strokeWidth={1.8} strokeLinejoin="round"
        />

        {/* החזר מוארך, ניצב לכיוון האור — כמו השתקפות של חלון */}
        <ellipse
          cx={sx} cy={sy} rx={k * 0.46} ry={k * 0.2}
          transform={`rotate(${L.tilt + 90} ${sx} ${sy})`}
          fill={`url(#spec-${uid})`}
        />
        {/* הגרעין החד. חדות כאן היא מה שקורא כזכוכית ולא כפלסטיק. */}
        <ellipse
          cx={sx - dx * k * 0.04} cy={sy - dy * k * 0.04}
          rx={k * 0.16} ry={k * 0.068}
          transform={`rotate(${L.tilt + 90} ${sx} ${sy})`}
          fill="#fff" opacity={0.92}
        />
        {/* ניצוץ משני בצד הרחוק — החזר פנימי מהדופן הנגדית */}
        <ellipse
          cx={qx} cy={qy} rx={k * 0.16} ry={k * 0.06}
          transform={`rotate(${L.tilt + 90} ${qx} ${qy})`}
          fill="#fff" opacity={0.13}
        />

        {/* בעלות — הבהרה קלה של כל השפה, לבן בלבד. הממשק אכרומטי:
            גוון כאן היה משבש את שיפוט הצבע (CLAUDE.md, מערכת העיצוב). */}
        <path
          d={d} fill="none" stroke="#fff" strokeOpacity={owner === 'p' ? 0.22 : 0.05}
          strokeWidth={RR * 2} strokeLinejoin="round"
        />
      </g>
    </g>
  );
});

/* ------------------------------------------------------------------ */

/** הגדרות משותפות לכל האבנים — שתי טשטושים, ותו לא */
export function GlassDefs() {
  return (
    <defs>
      <filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
      <filter id="cast" x="-40%" y="-40%" width="180%" height="200%">
        <feGaussianBlur stdDeviation="4.5" />
      </filter>
      {/* זוהר הצורה החתימתית */}
      <filter id="halo" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
  );
}

/** צל האבנים — קבוצה אחת, טשטוש אחד, במקום פילטר לכל אבן */
export function Shadows({ ids }: { ids: CellId[] }) {
  if (!ids.length) return null;
  return (
    <g filter="url(#cast)" opacity={0.55} transform="translate(2.5 4)">
      {ids.map((id) => {
        const { s, r } = parse(id);
        return <Facet key={id} d={gemPath(s, r)} paint="#000" />;
      })}
    </g>
  );
}
