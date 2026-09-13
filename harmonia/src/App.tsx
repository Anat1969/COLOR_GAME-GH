// הרמוניה — הרכיב הראשי. מחבר את המנוע (פונקציות טהורות) ל-UI.
import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import type { CellId, GameState, Family, Scored } from './engine/types';
import {
  newGame, applyPlacement, applyEndPenalty, isGameOver, detect, tally,
} from './engine/reducer';
import { bestMove } from './engine/ai';
import { FAMILY, LEVELS } from './data/content';
import { Wheel } from './components/Wheel';
import { HandTray } from './components/HandTray';
import { DeclareBar } from './components/DeclareBar';
import { ExplainCard, type Explain } from './components/ExplainCard';
import { Ledger } from './components/Ledger';
import { Diagnostic } from './components/Diagnostic';

const STORE = 'harmonia.progress';
const readUnlocked = (): number => {
  try { return Math.min(LEVELS.length - 1, +(localStorage.getItem(STORE) ?? 0) || 0); }
  catch { return 0; }
};
const writeUnlocked = (idx: number): void => {
  try { if (idx > readUnlocked()) localStorage.setItem(STORE, String(idx)); }
  catch { /* אחסון חסום — המשחק ממשיך בלי התמדה */ }
};

export default function App() {
  const gRef = useRef<GameState>(newGame(0));
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [figure, setFigure] = useState<Scored[] | null>(null);
  const [explain, setExplain] = useState<Explain | null>(null);
  const [hover, setHover] = useState<CellId | null>(null);
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const G = gRef.current;
  const redraw = useCallback(() => force(), []);

  const start = useCallback((levelIdx: number) => {
    gRef.current = newGame(levelIdx);
    setFigure(null);
    setExplain(null);
    setHover(null);
    redraw();
  }, [redraw]);

  const preview = useCallback(() => {
    const sel = [...G.sel];
    if (sel.length < 2) { setExplain(null); return; }
    const list = detect(G.board, sel, G.ledger, G.active);
    setExplain(list.length
      ? { preview: true, list, ...tally(list) }
      : { none: true, list: [] });
  }, [G]);

  const toggle = useCallback((id: CellId) => {
    if (G.over || G.busy || G.pending) return;
    if (G.sel.has(id)) G.sel.delete(id); else G.sel.add(id);
    redraw();
    preview();
  }, [G, redraw, preview]);

  const finish = useCallback(() => {
    applyEndPenalty(G);
    if (G.score.p > G.score.c) {
      writeUnlocked(G.levelIdx + 1);
      setUnlocked(readUnlocked());
    }
    redraw();
  }, [G, redraw]);

  const cpuTurn = useCallback(() => {
    if (G.over) return;
    G.busy = true; redraw();
    setTimeout(() => {
      const mv = bestMove(G, G.cpu, G.level.ai);
      if (!mv) {
        G.passes++;
        if (G.pot.length) {
          const back = G.cpu.splice(0, Math.min(3, G.cpu.length));
          G.pot.push(...back);
          for (let i = G.pot.length - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [G.pot[i], G.pot[j]] = [G.pot[j], G.pot[i]];
          }
          while (G.cpu.length < G.level.hand && G.pot.length) G.cpu.push(G.pot.pop()!);
          G.log.push('<b>המחשב</b> — החלפה');
        } else G.log.push('<b>המחשב</b> — ויתור');
        G.busy = false; redraw();
        if (isGameOver(G)) finish();
        return;
      }
      applyPlacement(G, mv.sel, mv.list, 'c');
      G.busy = false;
      setFigure(mv.list);
      setExplain({ head: 'המהלך של המחשב', list: mv.list, ...tally(mv.list) });
      redraw();
      if (!G.cpu.length && !G.pot.length) { G.score.c += 30; finish(); }
    }, 900);
  }, [G, redraw, finish]);

  const commit = useCallback((sel: CellId[], list: Scored[], mult: number, note?: string) => {
    const t = tally(list);
    applyPlacement(G, sel, list, 'p', mult);
    G.sel.clear();
    setFigure(list);
    setExplain({ list, ...t, note });
    setHover(null);
    redraw();
    if (!G.hand.length && !G.pot.length) { G.score.p += 30; finish(); return; }
    setTimeout(cpuTurn, 1600);
  }, [G, redraw, cpuTurn, finish]);

  const place = useCallback(() => {
    const sel = [...G.sel];
    const list = detect(G.board, sel, G.ledger, G.active);
    if (!list.length) return;
    if (G.level.declare === 'auto') { commit(sel, list, 1.0); return; }
    G.pending = { sel, list };
    redraw();
  }, [G, redraw, commit]);

  const declare = useCallback((n: Family | null) => {
    if (!G.pending) return;
    const { sel, list } = G.pending;
    let mult: number; let note: string;
    if (n === null) { mult = 0.6; note = 'ללא הכרזה — 60% ניקוד.'; }
    else if (n === list[0].n) { mult = 1.0; note = 'הכרזה נכונה.'; G.stat.declOk++; }
    else { mult = 0.5; note = `ההרמוניה הגבוהה הייתה ${list[0].n} · ${FAMILY[list[0].n].name}. חצי ניקוד.`; }
    if (n !== null) {
      G.stat.declTotal++;
      const f = list[0].n;
      G.stat.byFam[f] = G.stat.byFam[f] ?? { ok: 0, all: 0 };
      G.stat.byFam[f].all++;
      if (n === f) G.stat.byFam[f].ok++;
    }
    G.pending = null;
    commit(sel, list, mult, note);
  }, [G, commit]);

  const swap = useCallback(() => {
    const sel = [...G.sel].slice(0, 3);
    for (const c of sel) { G.hand.splice(G.hand.indexOf(c), 1); G.pot.push(c); }
    for (let i = G.pot.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [G.pot[i], G.pot[j]] = [G.pot[j], G.pot[i]];
    }
    while (G.hand.length < G.level.hand && G.pot.length) G.hand.push(G.pot.pop()!);
    G.sel.clear();
    G.log.push(`<b>את</b> — החלפת ${sel.length} אבנים`);
    setExplain(null); setFigure(null); setHover(null); redraw();
    setTimeout(cpuTurn, 700);
  }, [G, redraw, cpuTurn]);

  const pass = useCallback(() => {
    G.sel.clear(); G.passes++;
    G.log.push('<b>את</b> — ויתור');
    setExplain(null); setFigure(null); redraw();
    if (isGameOver(G)) { finish(); return; }
    setTimeout(cpuTurn, 700);
  }, [G, redraw, cpuTurn, finish]);

  const hint = useCallback(() => {
    const best = bestMove(G, G.hand, 'תכנן');
    if (!best) { setExplain({ none: true, list: [] }); return; }
    G.score.p -= 5;
    G.sel = new Set(best.sel);
    G.log.push('<b>את</b> — מצפן · 5−');
    redraw(); preview();
  }, [G, redraw, preview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (G.pending) { G.pending = null; redraw(); }
      else if (G.sel.size) { G.sel.clear(); setExplain(null); redraw(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [G, redraw]);

  const sel = [...G.sel];
  const canPlace = sel.length >= 2 && detect(G.board, sel, G.ledger, G.active).length > 0;
  const busy = G.over || G.busy || !!G.pending;

  // שורת ההנחיה: אומרת בדיוק מה חסר כדי להתקדם, במקום להשאיר כפתור מת.
  const guidance =
    G.over ? 'המשחק הסתיים.'
    : G.busy ? 'המחשב מחשב את מהלכו.'
    : G.pending ? 'נקבי במשפחת ההרמוניה שיצרת.'
    : sel.length === 0 ? 'בחרי אבנים מהמגש — כל תור חייב ליצור לפחות הרמוניה אחת.'
    : sel.length === 1 ? 'אבן אחת אינה יחס. בחרי עוד אחת לפחות.'
    : canPlace ? 'הצירוף יוצר הרמוניה. אפשר להניח.'
    : 'הצירוף הזה אינו יוצר הרמוניה — נסי אחר, או החליפי אבנים.';

  return (
    <>
      <header>
        <h1>הרמוניה</h1>
        <label className="lvl">
          רמה{' '}
          <select
            value={G.levelIdx}
            onChange={(e) => start(+e.target.value)}
            aria-label="בחירת רמה"
          >
            {LEVELS.map((L, i) => (
              <option key={L.n} value={i} disabled={i > unlocked}>
                {L.n} · {L.name}{i > unlocked ? ' (נעולה)' : ''}
              </option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        <div className="score" aria-live="polite">
          <div className={`item${G.score.p >= G.score.c ? ' lead' : ''}`}>
            <span className="v num">{Math.round(G.score.p)}</span><span className="l">את</span>
          </div>
          <div className={`item${G.score.c > G.score.p ? ' lead' : ''}`}>
            <span className="v num">{Math.round(G.score.c)}</span><span className="l">המחשב</span>
          </div>
          <div className="item">
            <span className="v num">{G.pot.length}</span><span className="l">בקופה</span>
          </div>
        </div>
      </header>

      <main>
        <aside>
          <h3>ספר ההרמוניות</h3>
          <Ledger G={G} />
        </aside>

        <div id="stage">
          <Wheel G={G} figure={figure} hover={hover} onToggle={toggle} onHover={setHover} />
        </div>

        <aside>
          <h3>המהלך האחרון</h3>
          <ExplainCard x={explain} />
          <h3 style={{ marginTop: 24 }}>יומן</h3>
          {G.log.length
            ? G.log.slice(-9).reverse().map((l, i) => (
                <div className="log" key={G.log.length - i} dangerouslySetInnerHTML={{ __html: l }} />
              ))
            : <p className="empty">המשחק מתחיל.</p>}
        </aside>
      </main>

      <footer>
        <HandTray G={G} hover={hover} onToggle={toggle} onHover={setHover} />
        {G.pending ? (
          <DeclareBar G={G} onDeclare={declare} />
        ) : (
          <div className="bar">
            <button className="primary" disabled={busy || !canPlace} onClick={place}>הנחה</button>
            <button
              disabled={busy || sel.length === 0 || sel.length > 3 || !G.pot.length}
              onClick={swap}
            >החלפה</button>
            <button disabled={busy} onClick={pass}>ויתור</button>
            <button disabled={busy} onClick={hint}>מצפן · 5−</button>
            <button onClick={() => start(G.levelIdx)}>משחק חדש</button>
          </div>
        )}
        <p className="hintline" aria-live="polite">{guidance}</p>
      </footer>

      {G.over && (
        <div id="over">
          <Diagnostic G={G} unlocked={unlocked} onPick={start} />
        </div>
      )}
    </>
  );
}
