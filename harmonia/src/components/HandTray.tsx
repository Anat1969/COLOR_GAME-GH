// הרמוניה — מגש היד.
// כל אבן היא אותה זכוכית שעל הלוח, בגוף כדורי: אותו מקור אור מלמעלה־משמאל,
// אותה בליעת קצה, אותה קאוסטיקה בצד הנגדי. מעבר עכבר מדליק את התא שאליו
// האבן שייכת — זה הקשר שמלמד "מה" ו"היכן" בו־זמנית.
import type { CSSProperties } from 'react';
import type { CellId, GameState } from '../engine/types';
import { hslOf, parse, SEG_NAMES_HE } from '../engine/wheel';

interface Props {
  G: GameState;
  hover: CellId | null;
  onToggle: (id: CellId) => void;
  onHover: (id: CellId | null) => void;
}

export function HandTray({ G, hover, onToggle, onHover }: Props) {
  const disabled = G.over || G.busy || !!G.pending;
  return (
    <div id="tray" role="group" aria-label="מגש האבנים">
      {G.hand.map((id) => {
        const { s, r } = parse(id);
        const c = hslOf(id);
        const style = {
          '--h': c.h, '--s': `${c.s}%`, '--l': `${c.l}%`,
        } as CSSProperties;
        const on = G.sel.has(id);
        return (
          <button
            key={id}
            type="button"
            className={`gem${on ? ' on' : ''}${hover === id ? ' peek' : ''}`}
            style={style}
            disabled={disabled}
            aria-pressed={on}
            aria-label={`${SEG_NAMES_HE[s]}, טבעת ${r}`}
            title={`${SEG_NAMES_HE[s]} · טבעת ${r}`}
            onClick={() => onToggle(id)}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(id)}
            onBlur={() => onHover(null)}
          >
            <span className="ring" aria-hidden="true">{r}</span>
          </button>
        );
      })}
      {!G.hand.length && <p className="empty">היד ריקה.</p>}
    </div>
  );
}
