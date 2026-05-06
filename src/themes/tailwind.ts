// Tailwind theme-bridge helper for @nirioppai/feature-suggestions
// Usage: import { applyTailwindTheme } from '@nirioppai/feature-suggestions/themes/tailwind'
//
// Zero runtime dependency on Tailwind CSS. Reads the `dark` class on
// <html> for auto color-scheme detection (Tailwind's default dark-mode strategy).

export interface TailwindThemeOptions {
  /** How to resolve the color scheme. Defaults to 'auto' (follows <html class="dark">). */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Primary color. Defaults to Tailwind indigo-500. */
  primary?: string;
  /** Font family string. Defaults to 'inherit' (inherits Tailwind's base font). */
  fontFamily?: string;
  /** Maps to Tailwind's radius scale. Defaults to 'md'. */
  radiusScale?: 'sm' | 'md' | 'lg';
  /** Status pill palette variant. Defaults to 'tailwind-default'. */
  statusPalette?: 'tailwind-default' | 'pastel' | 'high-contrast';
}

const STATUS_PALETTES: Record<
  NonNullable<TailwindThemeOptions['statusPalette']>,
  Record<string, string>
> = {
  'tailwind-default': {
    '--fs-status-under-review-bg': '#f3f4f6',
    '--fs-status-under-review-fg': '#374151',
    '--fs-status-planned-bg': '#e0f2fe',
    '--fs-status-planned-fg': '#0369a1',
    '--fs-status-in-progress-bg': '#fef3c7',
    '--fs-status-in-progress-fg': '#d97706',
    '--fs-status-completed-bg': '#dcfce7',
    '--fs-status-completed-fg': '#16a34a',
    '--fs-status-declined-bg': '#fee2e2',
    '--fs-status-declined-fg': '#dc2626',
  },
  pastel: {
    '--fs-status-under-review-bg': '#e2e8f0',
    '--fs-status-under-review-fg': '#475569',
    '--fs-status-planned-bg': '#bfdbfe',
    '--fs-status-planned-fg': '#1e40af',
    '--fs-status-in-progress-bg': '#fde68a',
    '--fs-status-in-progress-fg': '#b45309',
    '--fs-status-completed-bg': '#bbf7d0',
    '--fs-status-completed-fg': '#15803d',
    '--fs-status-declined-bg': '#fecaca',
    '--fs-status-declined-fg': '#991b1b',
  },
  'high-contrast': {
    '--fs-status-under-review-bg': '#374151',
    '--fs-status-under-review-fg': '#f9fafb',
    '--fs-status-planned-bg': '#1e40af',
    '--fs-status-planned-fg': '#ffffff',
    '--fs-status-in-progress-bg': '#92400e',
    '--fs-status-in-progress-fg': '#fef3c7',
    '--fs-status-completed-bg': '#166534',
    '--fs-status-completed-fg': '#dcfce7',
    '--fs-status-declined-bg': '#991b1b',
    '--fs-status-declined-fg': '#fee2e2',
  },
};

const RADIUS_SCALES: Record<
  NonNullable<TailwindThemeOptions['radiusScale']>,
  Record<string, string>
> = {
  sm: {
    '--fs-radius-sm': '2px',
    '--fs-radius-md': '4px',
    '--fs-radius-lg': '6px',
  },
  md: {
    '--fs-radius-sm': '6px',
    '--fs-radius-md': '8px',
    '--fs-radius-lg': '12px',
  },
  lg: {
    '--fs-radius-sm': '8px',
    '--fs-radius-md': '12px',
    '--fs-radius-lg': '16px',
  },
};

/**
 * Apply a Tailwind-flavoured theme to a feature-suggestions element.
 *
 * When `colorScheme` is `'auto'` (the default), a `MutationObserver` watches
 * `document.documentElement` for the `dark` class — the same mechanism Tailwind
 * uses. Call the returned unsubscribe function to disconnect the observer when
 * the widget is removed from the page.
 *
 * @param el   The `<feature-suggestions>` host element.
 * @param opts Theme options.
 * @returns    An unsubscribe function that stops dark-mode auto-detection.
 */
export function applyTailwindTheme(
  el: HTMLElement,
  opts: TailwindThemeOptions = {},
): () => void {
  const set = (name: string, value: string): void =>
    el.style.setProperty(name, value);

  const {
    primary = 'rgb(99 102 241)', // Tailwind indigo-500
    fontFamily = 'inherit',
    radiusScale = 'md',
    statusPalette = 'tailwind-default',
    colorScheme = 'auto',
  } = opts;

  set('--fs-primary-color', primary);
  set('--fs-font', fontFamily);

  for (const [k, v] of Object.entries(RADIUS_SCALES[radiusScale])) set(k, v);
  for (const [k, v] of Object.entries(STATUS_PALETTES[statusPalette])) set(k, v);

  const resolveScheme = (): 'light' | 'dark' => {
    if (colorScheme === 'dark') return 'dark';
    if (colorScheme === 'light') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };

  const applyScheme = (): void => {
    el.setAttribute('data-color-scheme', resolveScheme());
  };

  applyScheme();

  if (colorScheme === 'auto') {
    const observer = new MutationObserver(applyScheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }

  return () => {};
}
