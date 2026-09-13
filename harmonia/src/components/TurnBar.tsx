// הרמוניה — באנר התור ושעוני החשיבה.
// עונה על "של מי התור" ועל "זמן לכל אחד": שני שעונים, אחד לכל צד, מתקתקים
// רק בתור של אותו צד. בלי עונש ובלי לחץ — זמן חשיבה, לא שעון קרב.
// אכרומטי: הצד הפעיל מודגש בלבן.

interface Props {
  turn: 'p' | 'c';
  clock: { p: number; c: number };
  over: boolean;
  solo?: boolean;
}

const fmt = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function TurnBar({ turn, clock, over, solo }: Props) {
  // סולו: אין יריב — פס תרגול עם שעון חשיבה אחד, בלי צד "מחשב".
  if (solo) {
    return (
      <div className="turnbar solo" role="status" aria-live="polite">
        <div className="tside on">
          <span className="twho">זמן חשיבה</span>
          <span className="tclk num">{fmt(clock.p)}</span>
        </div>
        <div className="tmsg">{over ? 'סיום התרגול' : 'מצב תרגול — בונים ולומדים'}</div>
        <div className="tside" aria-hidden="true" />
      </div>
    );
  }

  const active = (side: 'p' | 'c') => !over && turn === side;
  return (
    <div className="turnbar" role="status" aria-live="polite">
      <div className={`tside ${active('p') ? 'on' : ''}`}>
        <span className="twho">את</span>
        <span className="tclk num">{fmt(clock.p)}</span>
      </div>

      <div className="tmsg">
        {over ? 'המשחק הסתיים'
          : turn === 'p' ? 'התור שלך'
          : 'תור המחשב — חושב…'}
      </div>

      <div className={`tside ${active('c') ? 'on' : ''}`}>
        <span className="twho">המחשב</span>
        <span className="tclk num">{fmt(clock.c)}</span>
      </div>
    </div>
  );
}
