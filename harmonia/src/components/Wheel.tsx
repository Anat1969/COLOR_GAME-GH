// הרמוניה — הגלגל. SVG, 60 תאים, אבני זכוכית, שרטוט הצורה החתימתית.
import type { CellId, GameState, Scored } from '../engine/types';
import {
  SEGS, RINGS, RADII, CX, CY, cid, parse, center, labelPos,
  SEG_NAMES, SEG_NAMES_HE,
} from '../engine/wheel';
import { GlassDefs, Ghost, Shadows, Socket, Stone } from './Gem';

interface Props {
  G: GameState;
  figure: Scored[] | null;
  ghostFigure?: Scored[] | null;   // הצירוף המיטבי שהוחמץ — קו מקווקו עמום
  hover: CellId | null;
  onToggle: (id: CellId) => void;
  onHover: (id: CellId | null) => void;
}

export function Wheel({ G, figure, ghostFigure, hover, onToggle, onHover }: Props) {
  const inSet = new Set(G.cells);
  const live = !G.over && !G.busy && !G.pending;
  const inHand = new Set(G.hand);
  const placed = [...G.board.keys()];

  const cells: CellId[] = [];
  for (let s = 0; s < SEGS; s++) {
    for (let r = 1; r <= RINGS; r++) {
      const id = cid(s, r);
      if (inSet.has(id)) cells.push(id);
    }
  }
  const empty = cells.filter((id) => !G.board.has(id));

  // הלוח נבנה סביב הטבעות הפעילות בלבד. ברמות 1–2 פעילות טבעות 2–4,
  // ולוח בקוטר מלא היה מותיר טבעת אפורה ריקה ותוויות מרחפות הרחק מהאבנים.
  const rMin = Math.min(...G.level.rings);
  const rMax = Math.max(...G.level.rings);
  const rimR = RADII[rMax] + 6;
  const wellR = RADII[rMin - 1];        // הגבול הפנימי של שדה המשחק
  const hubR = RADII[0] - 4;            // הלב נשאר קטן: לבן ניטרלי לכיול העין

  return (
    <svg id="wheel" viewBox="0 0 720 764" role="img"
      aria-label="גלגל הצבעים — שתים־עשרה משפחות גוון על פני חמש טבעות ערך">
      <GlassDefs />
      <defs>
        {/* גוף הלוח — דיסקה מעט מוארת מלמעלה, כדי שהשקעים יקראו כחלל */}
        <radialGradient id="board" gradientUnits="userSpaceOnUse"
          cx={CX - 120} cy={CY - 150} r={430}>
          <stop offset="0" stopColor="#3C3C42" />
          <stop offset=".6" stopColor="#2E2E33" />
          <stop offset="1" stopColor="#232327" />
        </radialGradient>
        <radialGradient id="hub" gradientUnits="userSpaceOnUse"
          cx={CX - 12} cy={CY - 14} r={44}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".55" stopColor="#F0F0EC" />
          <stop offset="1" stopColor="#C9C9C4" />
        </radialGradient>
      </defs>

      {/* הלוח */}
      <circle cx={CX} cy={CY} r={rimR} fill="url(#board)" />
      <circle cx={CX} cy={CY} r={rimR} fill="none"
        stroke="rgba(255,255,255,.08)" strokeWidth={1} />

      {/* שקעים — נחצבים לכל תא פעיל */}
      <g>{cells.map((id) => <Socket key={id} id={id} />)}</g>

      {/* תאים ריקים: רמז גוון, מתעורר במעבר עכבר ובבחירה */}
      <g>
        {empty.map((id) => {
          const { s, r } = parse(id);
          const playable = live && inHand.has(id);
          const state = G.sel.has(id) ? 'sel' : hover === id ? 'hover' : 'off';
          return (
            <g
              key={id}
              className={`cell ${playable ? 'playable' : ''}`}
              onClick={playable ? () => onToggle(id) : undefined}
              onMouseEnter={playable ? () => onHover(id) : undefined}
              onMouseLeave={playable ? () => onHover(null) : undefined}
              onFocus={playable ? () => onHover(id) : undefined}
              onBlur={playable ? () => onHover(null) : undefined}
              role={playable ? 'button' : undefined}
              tabIndex={playable ? 0 : undefined}
              onKeyDown={playable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(id); }
              } : undefined}
              aria-pressed={playable ? G.sel.has(id) : undefined}
              aria-label={playable
                ? `${SEG_NAMES_HE[s]}, טבעת ${r}${G.sel.has(id) ? ' — נבחרה' : ''}`
                : undefined}
            >
              <Ghost id={id} lit={state} />
            </g>
          );
        })}
      </g>

      {/* צללי האבנים, ואז האבנים */}
      <Shadows ids={placed} />
      <g>{placed.map((id) => <Stone key={id} id={id} owner={G.board.get(id)!} />)}</g>

      {/* הבאר הפנימית — קו שמגדיר את גבול שדה המשחק, כשטבעת 1 אינה פעילה */}
      {wellR > RADII[0] && (
        <circle cx={CX} cy={CY} r={wellR} fill="none"
          stroke="rgba(0,0,0,.45)" strokeWidth={2} />
      )}

      {/* הלב — לבן ניטרלי. נקודת הייחוס שמולה נשפט כל גוון. */}
      <circle cx={CX} cy={CY} r={hubR} fill="url(#hub)" />
      <circle cx={CX} cy={CY} r={hubR} fill="none"
        stroke="rgba(0,0,0,.30)" strokeWidth={1} />

      {/* תוויות הפלחים — עברית, כיתר הממשק */}
      {SEG_NAMES_HE.map((name, s) => {
        const [x, y] = labelPos(s, rMax);
        return <text key={SEG_NAMES[s]} className="lbl" x={x} y={y}>{name}</text>;
      })}

      {/* הצירוף המיטבי שהוחמץ — קו מקווקו עמום, נבדל מהצורה המלאה */}
      {ghostFigure?.map((f, i) => {
        const pts = f.cells.map(center);
        const closed = f.n >= 3;
        const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L')
          + (closed ? 'Z' : '');
        return (
          <g key={`ghost-${f.key}-${i}`} className="ghost-figure">
            <path className="gf-line" d={d} />
            {pts.map((p, j) => (
              <circle key={j} className="gf-node" cx={p[0]} cy={p[1]} r={2.6} />
            ))}
          </g>
        );
      })}

      {/* הצורה החתימתית — ההרמוניה משרטטת את עצמה */}
      {figure?.map((f, i) => {
        const pts = f.cells.map(center);
        const closed = f.n >= 3;
        const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L')
          + (closed ? 'Z' : '');
        return (
          <g key={`${f.key}-${i}`} className="figure">
            <path className="fig-halo" d={d} filter="url(#halo)" />
            <path className="fig-line" d={d} />
            {pts.map((p, j) => (
              <circle key={j} className="fig-node" cx={p[0]} cy={p[1]} r={3.2} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
