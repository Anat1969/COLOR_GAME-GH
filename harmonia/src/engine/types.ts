// הרמוניה — טיפוסי הליבה

/** מזהה תא: "פלח-טבעת", לדוגמה "0-3" = BLUE, טבעת אמצעית */
export type CellId = `${number}-${number}`;

export type Owner = 'p' | 'c';               // player | computer
export type Family = 2 | 3 | 4 | 5 | 6 | 7;
export type PurityKind = 'hue' | 'value' | 'diagonal';
export type DeclareMode = 'must' | 'opt' | 'auto';
export type AiStyle = 'למד' | 'תכנן' | 'הלחן';

/** מופע הרמוניה בקטלוג */
export interface Harmony {
  variant: string;        // '3b', '5a', ...
  cells: CellId[];
  key: string;            // מפתח ייחודי (התאים ממוינים)
}

/** הרמוניה שזוהתה במהלך, עם ניקוד מחושב */
export interface Scored extends Harmony {
  n: Family;
  pts: number;
  purity: { m: number; label: string; kind: PurityKind };
  edge: boolean;          // פורשת טבעת 1 וגם 5
  fx?: import('./factors').FactorMeta;   // מטא-נתוני מודל הגורמים (משפחות 3, 4, …)
}

export interface Level {
  n: number;
  name: string;
  rings: number[];
  fams: Family[];
  declare: DeclareMode;
  ai: AiStyle;
  hand: number;           // גודל היד — ראו CLAUDE.md ממצא 3
  solo?: boolean;         // רמת תרגול ללא יריב ממוחשב
  require?: number;        // רמת הדרכה: מהלך = בדיוק N אבנים שהן הרמוניה ממשפחה N
}

export interface Stats {
  declTotal: number;
  declOk: number;
  byFam: Record<number, { ok: number; all: number }>;
  turns: number;
  stones: number;
  asym: number;
  diag: number;
  harm: number;
}

export interface GameState {
  level: Level;
  levelIdx: number;
  cells: CellId[];                     // תאי הרמה הנוכחית
  active: Harmony[];                   // הרמוניות רלוונטיות לרמה
  board: Map<CellId, Owner>;
  pot: CellId[];
  hand: CellId[];
  cpu: CellId[];
  ledger: Set<string>;                // מפתחות הרמוניה + בונוסים שכבר נוקדו
  sel: Set<CellId>;
  score: { p: number; c: number };
  found: Scored[];
  log: string[];
  over: boolean;
  busy: boolean;
  pending: { sel: CellId[]; list: Scored[] } | null;
  passes: number;
  stat: Stats;
}

export interface Move {
  sel: CellId[];
  list: Scored[];
  total: number;
  v: number;              // ערך פנימי לבחירת ה-AI
}
