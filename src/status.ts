import type { SuggestionStatus } from './types';

export const STATUS_OPTIONS: SuggestionStatus[] = [
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Declined',
];

const STATUS_SLUG_MAP: Record<SuggestionStatus, string> = {
  'Under Review': 'under-review',
  'Planned': 'planned',
  'In Progress': 'in-progress',
  'Completed': 'completed',
  'Declined': 'declined',
};

/**
 * Returns the CSS modifier slug for a given status.
 * Used as the `fs-card-status--{slug}` class on badge elements.
 * Only the five allowed statuses produce output — no arbitrary string injection.
 */
export function statusToClassName(status: SuggestionStatus): string {
  return STATUS_SLUG_MAP[status] ?? '';
}
