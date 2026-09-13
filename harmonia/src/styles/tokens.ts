// הרמוניה — טוקני העיצוב. מקור אמת יחיד לצבע, טיפוגרפיה, רווח.
// הממשק אכרומטי בכוונה: הגלגל מחזיק את כל הצבע (CLAUDE.md, SPEC §11).

export const tokens = {
  color: {
    canvas: '#2B2B2E',      // רקע ראשי — גרפיט ניטרלי
    surface: '#35353A',     // פאנלים
    surface2: '#3E3E43',    // מגש האבנים
    line: 'rgba(255,255,255,0.10)',
    line2: 'rgba(255,255,255,0.18)',
    text: '#EDEDEA',
    dim: '#A3A3A0',
    faint: '#76767A',
    glow: 'rgba(255,255,255,0.85)',   // הדגשה — לבן בלבד, ללא גוון
    heart: '#F2F2EF',                 // הלב במרכז הגלגל
  },
  space: { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32 },
  font: {
    display: "'Frank Ruhl Libre', Georgia, serif",   // כותרות ומספרים
    body: "'Assistant', system-ui, sans-serif",       // ממשק וגוף
    scale: { xs: 12, sm: 14, base: 16, lg: 20, xl: 28, xxl: 44 },
  },
  radius: { sm: 3, gem: '50%' },
  motion: {
    stone: '180ms cubic-bezier(0.2,0.8,0.2,1)',   // הנחת אבן
    trace: '1900ms ease-out',                      // שרטוט הצורה החתימתית
    figureGlow: 900,                               // זוהר הצורה (ms)
  },
} as const;

export type Tokens = typeof tokens;
