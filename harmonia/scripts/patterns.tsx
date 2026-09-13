// כלי הצגה — מצייר את תבניות משפחה נתונה כגלגלי-מיני, כל אחד עם הצורה
// הגיאומטרית, השם, החוק והניקוד. נועד לאישור/תיקון הגיאומטריה.
// שימוש:  node scripts/patterns.mjs <out.svg> <family=4>
// בנייה:  npx esbuild scripts/patterns.tsx --bundle --format=esm --platform=node
//         --external:react --external:react-dom --outfile=scripts/patterns.mjs
import { writeFileSync } from 'node:fs';
import { SEGS, RINGS, RADII, CX, CY, cid, sectorPath, center, hexOf } from '../src/engine/wheel';
import { VARIANT, LAW, FX_LABEL } from '../src/data/content';
import { FACTOR_PATTERNS, factorScore } from '../src/engine/factors';
import { buildCatalog } from '../src/engine/catalog';
import type { CellId } from '../src/engine/types';

const family = process.argv[3] ?? '4';
const cat = buildCatalog();

// מופע מייצג לכל תבנית — מעדיף מופע שנוגע בטבעת 3 (טבעת אמצעית, נקרא בבירור)
const rep = (variant: string): CellId[] => {
  const inst = cat.filter((h) => h.variant === variant);
  const mid = inst.find((h) => h.cells.some((c) => +c.split('-')[1] === 3));
  return (mid ?? inst[0])?.cells ?? [];
};

const ORDER = Object.keys(FACTOR_PATTERNS)
  .filter((k) => k[0] === family)
  .sort((a, b) => factorScore(a) - factorScore(b));

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
  const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L') + 'Z';
  s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`;
  for (const p of pts) s += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#fff"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="${RADII[0] - 4}" fill="#F2F2EF"/>`;
  return s;
};

const COLS = 3, CW = 340, CH = 380;
const W = COLS * CW, H = Math.ceil(ORDER.length / COLS) * CH;
let body = `<rect width="${W}" height="${H}" fill="#2B2B2E"/>`;

ORDER.forEach((v, i) => {
  const gx = (i % COLS) * CW, gy = Math.floor(i / COLS) * CH;
  const meta = FACTOR_PATTERNS[v];
  const sc = 0.36;
  const tx = CW / 2 - CX * sc, ty = 20 - CY * sc + 150;
  body += `<g transform="translate(${gx},${gy})">
    <g transform="translate(${tx},${ty}) scale(${sc})">${miniWheel(rep(v))}</g>
    <text x="${CW / 2}" y="${CH - 74}" fill="#EDEDEA" font-family="Georgia,serif" font-size="20" text-anchor="middle">${VARIANT[v]} · ${factorScore(v)} נק'</text>
    <text x="${CW / 2}" y="${CH - 50}" fill="#A3A3A0" font-family="sans-serif" font-size="13" text-anchor="middle" direction="rtl">${LAW[v]}</text>
    <text x="${CW / 2}" y="${CH - 28}" fill="#76767A" font-family="sans-serif" font-size="12" text-anchor="middle" direction="rtl">${FX_LABEL.distance[meta.distance]} · ${FX_LABEL.axes[meta.axes]} · ${FX_LABEL.symmetry[meta.symmetry]}</text>
  </g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
writeFileSync(process.argv[2] ?? 'patterns.svg', svg);
console.log('wrote', process.argv[2], 'family', family, ORDER.length, 'patterns');
