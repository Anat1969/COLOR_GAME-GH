// כלי בדיקה חזותית — מרנדר את הגלגל האמיתי ל-SVG סטטי, מחוץ לדפדפן.
// שימוש:  node scripts/shot.mjs <רמה 0-4> <שיעור מילוי 0-1> <קובץ יעד>
// (בנה תחילה:  npx esbuild scripts/shot.tsx --bundle --format=esm
//               --platform=node --external:react --external:react-dom
//               --outfile=scripts/shot.mjs)
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Wheel } from '../src/components/Wheel';
import { newGame } from '../src/engine/reducer';
import { cid } from '../src/engine/wheel';
import type { CellId } from '../src/engine/types';

const levelIdx = Number(process.argv[2] ?? 4);
const fill = Number(process.argv[3] ?? 1);
const target = process.argv[4] ?? 'board.svg';

const G = newGame(levelIdx);
G.cells.forEach((c, i) => {
  if (i / G.cells.length < fill) G.board.set(c, i % 3 === 0 ? 'c' : 'p');
});

// כמה תאים נשארים ריקים כדי שייראו גם השקע והרמז
const open: CellId[] = [cid(1, 3), cid(2, 3), cid(7, 2)].filter((c) => G.cells.includes(c));
open.forEach((c) => G.board.delete(c));
G.hand = open;
G.sel = new Set(open.slice(0, 1));

const svg = renderToStaticMarkup(
  h(Wheel, {
    G, figure: null, hover: open[1] ?? null,
    onToggle: () => {}, onHover: () => {},
  }),
).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

writeFileSync(target, svg);
console.log(`wrote ${target} — ${G.board.size} stones, ${svg.length} bytes`);
