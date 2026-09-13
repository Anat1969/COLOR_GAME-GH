/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// viteSingleFile מטמיע את כל ה-JS וה-CSS אל תוך dist/index.html כסקריפט
// רגיל (IIFE) — כך הקובץ הבנוי נפתח בלחיצה כפולה מ-file://, בלי שרת.
// ראו scripts/pack.mjs שמעתיק אותו לתיקיית המשחק כ"הרמוניה.html".
export default defineConfig({
  // נתיב יחסי: הקובץ המוטמע עובד גם מ-file:// וגם מתת-נתיב של GitHub Pages
  // (…github.io/COLOR_GAME-GH/) בלי לשבור טעינת נכסים.
  base: './',
  plugins: [react(), viteSingleFile()],
  test: { environment: 'node' },
});
