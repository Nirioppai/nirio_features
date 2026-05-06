import { describe, it, expect } from 'vitest';
import { STATUS_OPTIONS, statusToClassName } from './status';
import type { SuggestionStatus } from './types';

describe('STATUS_OPTIONS', () => {
  it('preserves the exact Phase 7 UI-SPEC order', () => {
    expect(STATUS_OPTIONS).toEqual([
      'Under Review',
      'Planned',
      'In Progress',
      'Completed',
      'Declined',
    ]);
  });

  it('contains exactly five status values', () => {
    expect(STATUS_OPTIONS).toHaveLength(5);
  });
});

describe('statusToClassName', () => {
  it('maps Under Review to under-review', () => {
    expect(statusToClassName('Under Review')).toBe('under-review');
  });

  it('maps Planned to planned', () => {
    expect(statusToClassName('Planned')).toBe('planned');
  });

  it('maps In Progress to in-progress', () => {
    expect(statusToClassName('In Progress')).toBe('in-progress');
  });

  it('maps Completed to completed', () => {
    expect(statusToClassName('Completed')).toBe('completed');
  });

  it('maps Declined to declined', () => {
    expect(statusToClassName('Declined')).toBe('declined');
  });

  it('all slugs contain only lowercase letters and hyphens — no arbitrary class injection', () => {
    STATUS_OPTIONS.forEach(status => {
      const slug = statusToClassName(status);
      expect(slug).toMatch(/^[a-z-]+$/);
    });
  });

  it('each allowed status produces a unique slug', () => {
    const slugs = STATUS_OPTIONS.map(statusToClassName);
    const unique = new Set(slugs);
    expect(unique.size).toBe(STATUS_OPTIONS.length);
  });

  it('unknown input via cast falls back to empty string — no class injection', () => {
    const unknown = statusToClassName('<script>alert(1)</script>' as SuggestionStatus);
    expect(unknown).toBe('');
  });
});
