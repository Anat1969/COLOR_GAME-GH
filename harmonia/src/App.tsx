// הרמוניה — הרכיב הראשי. מחבר את המנוע (פונקציות טהורות) ל-UI.
import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import type { CellId, GameState, Family, Scored, Move } from './engine/types';
import {
  newGame, applyPlacement, applyEndPenalty, isGameOver, detect, tally,
} from './engine/reducer';
import { analyzeSelection } from './engine/teach';
import { bestMove } from './engine/ai';
import { FAMILY, VARIANT, LEVELS } from './data/content';
import { Wheel } from './components/Wheel';
import { HandTray } from './components/HandTray';
import { DeclareBar } from './components/DeclareBar';
import { ExplainCard, type Explain } from './components/ExplainCard';
import { Ledger } from './components/Ledger';
import { Diagnostic } from './components/Diagnostic';
import { BestMove } from './components/BestMove';
import { TurnBar } from './components/TurnBar';
import { FamiliesLegend } from './components/FamiliesLegend';
import { RelationTypes } from './components/RelationTypes';
import { Palette } from './components/Palette';

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
  const [clock, setClock] = useState({ p: 0, c: 0 });
  const [bestPanel, setBestPanel] = useState<{ best: Move; actualPts: number } | null>(null);
  const G = gRef.current;
  const redraw = useCallback(() => force(), []);

  // שעוני החשיבה — הצד הפעיל מתקתק בכל שנייה, בלי עונש. קורא את המצב
  // מה-ref כדי להישאר עדכני בלי לחדש את ה-interval בכל ציור.
  useEffect(() => {
    const id = setInterval(() => {
      const g = gRef.current;
      if (g.over) return;
      setClock((cl) => (g.busy ? { ...cl, c: cl.c + 1 } : { ...cl, p: cl.p + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const start = useCallback((levelIdx: number) => {
    gRef.current = newGame(levelIdx);
    setFigure(null);
    setExplain(null);
    setHover(null);
    setClock({ p: 0, c: 0 });
    setBestPanel(null);
    redraw();
  }, [redraw]);

  const preview = useCallback(() => {
    const sel = [...G.sel];
    // רמת הדרכה: תצוגה מקדימה רק כשיש בדיוק `require` אבנים שהן הרמוניה שלמה
    if (G.level.require !== undefined) {
      if (sel.length !== G.level.require) { setExplain(null); return; }
      const a = analyzeSelection(G.board, sel, G.ledger, G.active, G.level.require);
      setExplain(a.ok ? { preview: true, list: a.list, ...tally(a.list) } : null);
      return;
    }
    if (sel.length < 2) { setExplain(null); return; }
    const list = detect(G.board, sel, G.ledger, G.active);
    setExplain(list.length
      ? { preview: true, list, ...tally(list) }
      : null);   // אין תצוגה מקדימה שלילית — המשוב ניתן רק ב"סיום הבחירה"
  }, [G]);

  const toggle = useCallback((id: CellId) => {
    if (G.over || G.busy || G.pending) return;
    if (G.sel.has(id)) G.sel.delete(id); else G.sel.add(id);
    redraw();
    preview();
  }, [G, redraw, preview]);

  const finish = useCallback(() => {
    applyEndPenalty(G);
    const advance = G.level.solo ? G.found.length >= 1 : G.score.p > G.score.c;
    if (advance) {
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
      setExplain({ head: 'המהלך של המחשב', list: mv.list, committed: true, placed: mv.sel, ...tally(mv.list) });
      redraw();
      if (!G.cpu.length && !G.pot.length) { G.score.c += 30; finish(); }
    }, 900);
  }, [G, redraw, finish]);

  const commit = useCallback((sel: CellId[], list: Scored[], mult: number, note?: string) => {
    const t = tally(list);
    const placed = [...sel];
    // רמת הדרכה: לפני שמפנים את היד, חשב את הצירוף המיטבי שאפשר היה (לפי חוקי הרמה)
    if (G.level.require !== undefined) {
      const pre = bestMove(G, [...G.hand], 'תכנן', G.level.require);
      setBestPanel(pre ? { best: pre, actualPts: t.total } : null);
    } else {
      setBestPanel(null);
    }
    applyPlacement(G, sel, list, 'p', mult);
    G.sel.clear();
    setFigure(list);
    setExplain({ list, committed: true, placed, ...t, note });
    setHover(null);
    redraw();
    if (G.level.solo) {
      // תרגול סולו: אין תור מחשב. פותחים את רמה 2 אחרי שלוש הרמוניות ("קלטת את הרעיון").
      if (G.found.length >= 3 && G.levelIdx + 1 > unlocked) {
        writeUnlocked(G.levelIdx + 1);
        setUnlocked(readUnlocked());
      }
      if (isGameOver(G)) finish();
      return;
    }
    if (!G.hand.length && !G.pot.length) { G.score.p += 30; finish(); return; }
    setTimeout(cpuTurn, 1600);
  }, [G, redraw, cpuTurn, finish, unlocked]);

  // "סיום הבחירה ובדיקה" — פעיל תמיד כשיש אבן נבחרת. נותן ניקוד או משוב מכוון.
  const submit = useCallback(() => {
    const sel = [...G.sel];
    if (!sel.length) return;
    const a = analyzeSelection(G.board, sel, G.ledger, G.active, G.level.require);
    if (!a.ok) { setExplain({ none: true, near: a.near, size: a.size, list: [] }); return; }
    if (G.level.declare === 'auto') { commit(sel, a.list, 1.0); return; }
    G.pending = { sel, list: a.list };
    redraw();
  }, [G, redraw, commit]);

  // הכרזה: ברמת הדרכה (require) מכריזים על הווריאנט; ברמה 4 (opt) על המשפחה.
  const declare = useCallback((choice: string | Family | null) => {
    if (!G.pending) return;
    const { sel, list } = G.pending;
    const top = list[0];
    const byVariant = G.level.require !== undefined;
    const correct = byVariant ? choice === top.variant : choice === top.n;

    let mult: number; let note: string;
    if (choice === null) { mult = 0.6; note = 'ללא הכרזה — 60% ניקוד.'; }
    else if (correct) { mult = 1.0; note = 'הכרזה נכונה.'; G.stat.declOk++; }
    else {
      mult = 0.5;
      note = byVariant
        ? `זו ${FAMILY[top.n].name} · ${VARIANT[top.variant]}. חצי ניקוד.`
        : `ההרמוניה הגבוהה הייתה ${top.n} · ${FAMILY[top.n].name}. חצי ניקוד.`;
    }
    if (choice !== null) {
      G.stat.declTotal++;
      const f = top.n;
      G.stat.byFam[f] = G.stat.byFam[f] ?? { ok: 0, all: 0 };
      G.stat.byFam[f].all++;
      if (correct) G.stat.byFam[f].ok++;
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
    if (!G.level.solo) setTimeout(cpuTurn, 700);
  }, [G, redraw, cpuTurn]);

  const pass = useCallback(() => {
    G.sel.clear(); G.passes++;
    G.log.push('<b>את</b> — ויתור');
    setExplain(null); setFigure(null); redraw();
    if (isGameOver(G)) { finish(); return; }
    if (!G.level.solo) setTimeout(cpuTurn, 700);
  }, [G, redraw, cpuTurn, finish]);

  const hint = useCallback(() => {
    const best = bestMove(G, G.hand, 'תכנן', G.level.require);
    if (!best) { setExplain({ none: true, near: null, list: [] }); return; }
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
  const solo = !!G.level.solo;
  const busy = G.over || G.busy || !!G.pending;
  const turn: 'p' | 'c' = G.busy ? 'c' : 'p';
  const showPalette = !!explain && !explain.none && !explain.preview && (explain.list?.length ?? 0) > 0;
  const showPreviewPalette = !!explain && explain.preview && (explain.list?.length ?? 0) > 0;
  const bestDiff = bestPanel ? bestPanel.best.total - bestPanel.actualPts : 0;
  const ghost = bestPanel && bestDiff > 0.5 ? bestPanel.best.list : null;

  const req = G.level.require;
  const reqFam = req !== undefined ? FAMILY[G.level.fams[0]].name : '';
  const guidance =
    G.over ? (solo ? 'סיום התרגול. אפשר לנסות שוב או לעבור רמה.' : 'המשחק הסתיים.')
    : G.busy ? 'המחשב חושב את מהלכו…'
    : G.pending ? 'נקבי באיזו תבנית מדובר כדי לקבל ניקוד מלא.'
    : req !== undefined
      ? (sel.length === 0
          ? `בחרי בדיוק ${req} אבנים שיוצרות ${reqFam}, ואז "סיום הבחירה".`
          : sel.length !== req
            ? `בחרי בדיוק ${req} אבנים (יש לך ${sel.length}).`
            : 'לחצי "סיום הבחירה" כדי לבדוק ולקבל ניקוד ומשוב.')
    : sel.length === 0 ? 'בחרי אבנים מהמגש, ואז לחצי "סיום הבחירה".'
    : 'לחצי "סיום הבחירה" כדי לבדוק ולקבל ניקוד ומשוב.';

  return (
    <>
      <header>
        <h1>הרמוניה</h1>
        <label className="lvl">
          רמה{' '}
          <select value={G.levelIdx} onChange={(e) => start(+e.target.value)} aria-label="בחירת רמה">
            {LEVELS.map((L, i) => (
              <option key={L.n} value={i} disabled={i > unlocked}>
                {L.n} · {L.name}{i > unlocked ? ' (נעולה)' : ''}
              </option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        <div className="score" aria-live="polite">
          <div className={`item${solo || G.score.p >= G.score.c ? ' lead' : ''}`}>
            <span className="v num">{Math.round(G.score.p)}</span><span className="l">את</span>
          </div>
          {solo ? (
            <div className="item">
              <span className="v num">{G.found.length}</span><span className="l">הרמוניות</span>
            </div>
          ) : (
            <div className={`item${G.score.c > G.score.p ? ' lead' : ''}`}>
              <span className="v num">{Math.round(G.score.c)}</span><span className="l">המחשב</span>
            </div>
          )}
          <div className="item">
            <span className="v num">{G.pot.length}</span><span className="l">בקופה</span>
          </div>
        </div>
      </header>

      <main>
        <aside>
          <h3>אופי הצירופים</h3>
          <RelationTypes />
          <h3 style={{ marginTop: 20 }}>המשפחות ברמה זו</h3>
          <FamiliesLegend fams={G.level.fams} />
          <h3 style={{ marginTop: 20 }}>ספר ההרמוניות</h3>
          <Ledger G={G} />
        </aside>

        <div id="center">
          <TurnBar turn={turn} clock={clock} over={G.over} solo={solo} />
          <div id="stage">
            <Wheel G={G} figure={figure} ghostFigure={ghost} hover={hover}
              onToggle={toggle} onHover={setHover} />
          </div>
        </div>

        <aside>
          <h3>{explain?.none ? 'משוב' : explain?.committed ? 'המהלך האחרון' : 'הדרכה'}</h3>
          <ExplainCard x={explain} />
          {(showPalette || showPreviewPalette) && explain?.list && (
            <>
              <h3 style={{ marginTop: 20 }}>
                {showPreviewPalette ? 'לוח הצבעים שאת בונה' : 'לוח הצבעים שיצרת'}
              </h3>
              <Palette list={explain.list} />
            </>
          )}
          {bestPanel && G.level.require !== undefined && (
            <>
              <h3 style={{ marginTop: 20 }}>הצירוף הטוב ביותר</h3>
              <BestMove best={bestPanel.best} actualPts={bestPanel.actualPts} />
            </>
          )}
          <h3 style={{ marginTop: 20 }}>יומן</h3>
          {G.log.length
            ? G.log.slice(-8).reverse().map((l, i) => (
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
            <button className="primary" disabled={busy || sel.length < 1} onClick={submit}>
              סיום הבחירה ובדיקה
            </button>
            <button
              disabled={busy || sel.length === 0 || sel.length > 3 || !G.pot.length}
              onClick={swap}
            >החלפה</button>
            {!solo && <button disabled={busy} onClick={pass}>ויתור</button>}
            <button disabled={busy} onClick={hint}>מצפן · 5−</button>
            <button onClick={() => start(G.levelIdx)}>{solo ? 'לוח חדש' : 'משחק חדש'}</button>
          </div>
        )}
        <p className="hintline" aria-live="polite">{guidance}</p>
      </footer>

      {G.over && (
        <div id="over">
          <Diagnostic G={G} unlocked={unlocked} clock={clock} solo={solo} onPick={start} />
        </div>
      )}
    </>
  );
}
