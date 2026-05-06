// MUI theme-bridge helper for @nirioppai/feature-suggestions
// Usage: import { applyMuiTheme } from '@nirioppai/feature-suggestions/themes/mui'
//
// Zero hard runtime dependency on @mui/material — only structural types are used.
// Add @mui/material as an optional peer dep to get full Theme typing; this slice
// is sufficient for consumers who pass a real MUI Theme object at runtime.

/** Minimal slice of a MUI Theme palette needed by this helper. */
export interface MuiThemeSlice {
  palette: {
    mode: 'light' | 'dark';
    primary: { main: string };
    background: { default: string; paper: string };
    text: { primary: string; secondary: string };
    error: { main: string; light: string };
    divider: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: number;
  };
}

/**
 * Map a MUI Theme's palette onto a feature-suggestions element as `--fs-*`
 * CSS custom properties. Sets `data-color-scheme` to activate the built-in
 * dark preset for any vars not explicitly overridden here.
 *
 * @param el  The `<feature-suggestions>` host element.
 * @param theme  A MUI Theme (or compatible slice).
 * @returns  An unsubscribe function — call it when tearing down (e.g. before
 *           re-mounting the widget). MUI theme changes require re-calling
 *           `applyMuiTheme` — the return value cleans up any side-effects this
 *           helper registers (currently none; kept for API consistency).
 */
export function applyMuiTheme(
  el: HTMLElement,
  theme: MuiThemeSlice,
): () => void {
  const set = (name: string, value: string): void =>
    el.style.setProperty(name, value);

  const isDark = theme.palette.mode === 'dark';

  set('--fs-primary-color', theme.palette.primary.main);
  set('--fs-background', theme.palette.background.default);
  set('--fs-surface', theme.palette.background.paper);
  set('--fs-surface-elevated', theme.palette.background.paper);
  set(
    '--fs-surface-muted',
    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  );
  set('--fs-text-color', theme.palette.text.primary);
  set('--fs-text-muted', theme.palette.text.secondary);
  set('--fs-text-strong', theme.palette.text.primary);
  set('--fs-border', theme.palette.divider);
  set('--fs-border-strong', theme.palette.divider);
  set('--fs-border-focus', theme.palette.primary.main);
  set('--fs-error-color', theme.palette.error.main);
  // ~15% alpha tint for the error background
  set('--fs-error-bg', theme.palette.error.light + '26');
  set('--fs-error-border', theme.palette.error.light);
  set('--fs-backdrop', isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)');
  set('--fs-modal-bg', theme.palette.background.paper);

  if (theme.typography?.fontFamily) {
    set('--fs-font', theme.typography.fontFamily);
  }

  // Drive the built-in light/dark CSS-var preset for status pills, radii, etc.
  el.setAttribute('data-color-scheme', isDark ? 'dark' : 'light');

  return () => {};
}
