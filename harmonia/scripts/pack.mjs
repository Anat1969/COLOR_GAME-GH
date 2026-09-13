// אריזה — לוקח את הקובץ הבנוי (dist/index.html, כל ה-JS/CSS מוטמע בתוכו)
// וכותב אותו לתיקיית המשחק הראשית בשם "הרמוניה.html", ליד "גלגל ניוטון.jpg".
// זהו הקובץ ללחיצה כפולה: נפתח בדפדפן בלי שרת ובלי טרמינל.
//
// בדרך אנו מנרמלים את תגית הסקריפט מ-<script type="module"> ל-<script> רגיל.
// החבילה המוטמעת היא chunk יחיד ללא תחביר ES module (אין import/export/
// import.meta/import()), ולכן ההמרה בטוחה — והיא מבטיחה שהקובץ ירוץ מ-file://
// בכל דפדפן. מודול חיצוני נחסם ב-file:// (CORS); סקריפט קלאסי מוטמע — לא.
//
// רץ אחרי `vite build` (ראו package.json → build:play).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));           // harmonia/scripts
const projectRoot = resolve(here, '..');                       // harmonia
const gameFolder = resolve(projectRoot, '..');                 // תיקיית המשחק הראשית

const src = join(projectRoot, 'dist', 'index.html');
const dest = join(gameFolder, 'הרמוניה.html');

if (!existsSync(src)) {
  console.error(`✗ לא נמצא ${src} — הריצי קודם "vite build".`);
  process.exit(1);
}

let html = readFileSync(src, 'utf8');

// שכבת ביטחון: אם נותר תחביר מודול, נעצור במקום להוציא קובץ שעלול להיכשל.
const inlineModule = /<script\b[^>]*\btype=["']module["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
if (inlineModule && /\b(import|export)\b|import\s*\(|import\.meta/.test(inlineModule[1])) {
  console.error('✗ החבילה עדיין מכילה תחביר ES module — נדרש מודול, והוא לא ירוץ מ-file://.');
  process.exit(1);
}

// המרה לסקריפט קלאסי (מסירים type="module" ו-crossorigin מיותרים)
const before = html;
html = html.replace(/<script\b[^>]*\btype=["']module["'][^>]*>/i, '<script>');
if (html === before) {
  console.warn('⚠ לא נמצאה תגית module להמרה — ממשיכים כפי שהוא.');
}

writeFileSync(dest, html, 'utf8');
console.log(`✓ נוצר קובץ ללחיצה: ${dest}`);
console.log('  לחיצה כפולה עליו פותחת את המשחק בדפדפן, בלי שרת.');
