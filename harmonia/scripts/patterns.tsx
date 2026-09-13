// כלי הצגה — מצייר את תשע תבניות משפחה 3 כתשעה גלגלי-מיני, כל אחד עם
// הצורה הגיאומטרית, השם, החוק והניקוד. נועד לאישור/תיקון הגיאומטריה.
// בנייה:  npx esbuild scripts/patterns.tsx --bundle --format=esm --platform=node
//         --external:react --external:react-dom --outfile=scripts/patterns.mjs
import { writeFileSync } from 'node:fs';
import {
  SEGS, RINGS, RADII, CX, CY, cid, sectorPath, center, hexOf,
} from '../src/engine/wheel';
import { VARIANT, LAW, F3_LABEL } from '../src/data/content';
import { FAMILY3, family3Score } from '../src/engine/family3';
import type { CellId } from '../src/engine/types';

// מופע מייצג לכל תבנית (פלח מרכזי, כדי שהצורה תיקרא בבירור)
const REP: Record<string, CellId[]> = {
  '3a': ['0-2', '0-3', '0-4'],
  '3b': ['0-3', '4-3', '8-3'],
  '3c': ['0-3', '1-3', '2-3'],
  '3d': ['0-1', '0-3', '0-5'],
  '3e': ['0-3', '5-3', '7-3'],
  '3f': ['0-2', '0-3', '1-2'],
  '3g': ['0-1', '1-2', '2-3'],
  '3h': ['0-2', '0-3', '6-2'],
  '3i': ['0-1', '1-2', '3-3'],
} as unknown as Record<string, CellId[]>;

const ORDER = ['3a', '3c', '3d', '3b', '3e', '3f', '3g', '3h', '3i'];

const miniWheel = (cells: CellId[]): string => {
  const on = new Set(cells);
  let s = '';
  for (let seg = 0; seg < SEGS; seg++) {
    for (let r = 1; r <= RINGS; r++) {
      const id = cid(seg, r);
      const lit = on.has(id);
      s += `<path d="${sectorPath(seg, r, 3)}" fill="${lit ? hexOf(id) : 'none'}" ` +
        `stroke="rgba(255,255,255,${lit ? 0.5 : 0.12})" stroke-width="${lit ? 2 : 1}"/>`;
    }
  }
  const pts = cells.map(center);
  const closed = cells.length >= 3;
  const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L') + (closed ? 'Z' : '');
  s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`;
  for (const p of pts) s += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#fff"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="${RADII[0] - 4}" fill="#F2F2EF"/>`;
  return s;
};

const COLS = 3, CW = 340, CH = 380, PAD = 20;
const W = COLS * CW, H = Math.ceil(ORDER.length / COLS) * CH;
let body = `<rect width="${W}" height="${H}" fill="#2B2B2E"/>`;

ORDER.forEach((v, i) => {
  const gx = (i % COLS) * CW, gy = Math.floor(i / COLS) * CH;
  const meta = FAMILY3[v];
  const sc = 0.36;
  const tx = CW / 2 - CX * sc, ty = 20 - CY * sc + 150;
  body += `<g transform="translate(${gx},${gy})">
    <g transform="translate(${tx},${ty}) scale(${sc})">${miniWheel(REP[v])}</g>
    <text x="${CW / 2}" y="${CH - 74}" fill="#EDEDEA" font-family="Georgia,serif" font-size="20" text-anchor="middle">${VARIANT[v]} · ${family3Score(v)} נק'</text>
    <text x="${CW / 2}" y="${CH - 50}" fill="#A3A3A0" font-family="sans-serif" font-size="13" text-anchor="middle" direction="rtl">${LAW[v]}</text>
    <text x="${CW / 2}" y="${CH - 28}" fill="#76767A" font-family="sans-serif" font-size="12" text-anchor="middle" direction="rtl">${F3_LABEL.distance[meta.distance]} · ${F3_LABEL.axes[meta.axes]} · ${F3_LABEL.symmetry[meta.symmetry]}</text>
  </g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
writeFileSync(process.argv[2] ?? 'patterns.svg', svg);
console.log('wrote', process.argv[2], svg.length, 'bytes');
