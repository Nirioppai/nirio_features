import type { SuggestionStatus, SuggestionType } from './types';

export const STATUS_OPTIONS: SuggestionStatus[] = [
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Declined',
];

const STATUS_SLUG_MAP: Record<SuggestionStatus, string> = {
  'Under Review': 'under-review',
  Planned: 'planned',
  'In Progress': 'in-progress',
  Completed: 'completed',
  Declined: 'declined',
};

/**
 * Returns the CSS modifier slug for a given status.
 * Used as the `fs-card-status--{slug}` class on badge elements.
 * Only the five allowed statuses produce output — no arbitrary string injection.
 */
export function statusToClassName(status: SuggestionStatus): string {
  return STATUS_SLUG_MAP[status] ?? '';
}

const TYPE_SLUG_MAP: Record<SuggestionType, string> = {
  'New Feature': 'new-feature',
  'Feature Update': 'feature-update',
  'Bug Report': 'bug-report',
};

/**
 * Returns the CSS modifier slug for a given suggestion type.
 * Used as the `fs-card-type--{slug}` class on type badge elements.
 */
export function typeToClassName(type: SuggestionType): string {
  return TYPE_SLUG_MAP[type] ?? '';
}
