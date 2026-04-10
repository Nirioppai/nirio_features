import { describe, it, expect } from 'vitest';
import {
  sortSuggestions,
  filterSuggestions,
  renderFeedHTML,
  renderSuggestionCard,
} from './feed';
import type { Suggestion } from './types';

function makeSuggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    id: 'sug-1',
    title: 'Default title',
    type: 'New Feature',
    authorId: 'u1',
    authorName: 'Alice',
    voteCount: 0,
    commentCount: 0,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const suggestions: Suggestion[] = [
  makeSuggestion({ id: 'a', title: 'Alpha', voteCount: 5, commentCount: 1, createdAt: new Date('2024-01-03') }),
  makeSuggestion({ id: 'b', title: 'Beta',  voteCount: 2, commentCount: 8, createdAt: new Date('2024-01-01') }),
  makeSuggestion({ id: 'c', title: 'Gamma', voteCount: 9, commentCount: 3, createdAt: new Date('2024-01-02') }),
];

describe('sortSuggestions', () => {
  it('sorts by most-voted descending', () => {
    const sorted = sortSuggestions(suggestions, 'most-voted');
    expect(sorted.map(s => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts by trending (commentCount) descending', () => {
    const sorted = sortSuggestions(suggestions, 'trending');
    expect(sorted.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by newest (createdAt) descending', () => {
    const sorted = sortSuggestions(suggestions, 'newest');
    expect(sorted.map(s => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not mutate the original array', () => {
    const original = [...suggestions];
    sortSuggestions(suggestions, 'most-voted');
    expect(suggestions).toEqual(original);
  });
});

describe('filterSuggestions', () => {
  it('returns all suggestions for empty query', () => {
    expect(filterSuggestions(suggestions, '')).toHaveLength(3);
  });

  it('returns all suggestions for whitespace-only query', () => {
    expect(filterSuggestions(suggestions, '  ')).toHaveLength(3);
  });

  it('filters by title (case-insensitive)', () => {
    const result = filterSuggestions(suggestions, 'alpha');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('filters by details', () => {
    const withDetails = [
      makeSuggestion({ id: 'x', title: 'Thing', details: 'Export to CSV would help' }),
      makeSuggestion({ id: 'y', title: 'Other', details: 'No match here' }),
    ];
    const result = filterSuggestions(withDetails, 'csv');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('x');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterSuggestions(suggestions, 'zzznomatch')).toHaveLength(0);
  });
});

describe('renderFeedHTML', () => {
  it('renders loading state', () => {
    const html = renderFeedHTML([], true, 'newest', '');
    expect(html).toContain('fs-loading');
    expect(html).toContain('Loading suggestions...');
  });

  it('renders empty state when no suggestions', () => {
    const html = renderFeedHTML([], false, 'newest', '');
    expect(html).toContain('fs-empty');
    expect(html).toContain('No suggestions found.');
  });

  it('renders empty state when search matches nothing', () => {
    const html = renderFeedHTML(suggestions, false, 'newest', 'zzznomatch');
    expect(html).toContain('fs-empty');
  });

  it('renders suggestion cards', () => {
    const html = renderFeedHTML(suggestions, false, 'newest', '');
    expect(html).toContain('fs-cards');
    expect(html).toContain('Alpha');
    expect(html).toContain('Beta');
    expect(html).toContain('Gamma');
  });

  it('marks active sort button', () => {
    const html = renderFeedHTML(suggestions, false, 'most-voted', '');
    expect(html).toContain('fs-sort-btn--active');
    expect(html).toContain('data-sort="most-voted"');
  });

  it('renders cards in sorted order', () => {
    const html = renderFeedHTML(suggestions, false, 'most-voted', '');
    const gammaPos = html.indexOf('Gamma');
    const alphaPos = html.indexOf('Alpha');
    expect(gammaPos).toBeLessThan(alphaPos);
  });
});

describe('renderSuggestionCard', () => {
  it('renders title and author', () => {
    const html = renderSuggestionCard(makeSuggestion({ title: 'My idea', authorName: 'Bob' }));
    expect(html).toContain('My idea');
    expect(html).toContain('Bob');
  });

  it('renders vote and comment counts', () => {
    const html = renderSuggestionCard(makeSuggestion({ voteCount: 7, commentCount: 3 }));
    expect(html).toContain('▲ 7');
    expect(html).toContain('💬 3');
  });

  it('renders status badge when status is set', () => {
    const html = renderSuggestionCard(makeSuggestion({ status: 'Planned' }));
    expect(html).toContain('fs-card-status');
    expect(html).toContain('Planned');
  });

  it('does not render status badge when status is not set', () => {
    const html = renderSuggestionCard(makeSuggestion({ status: undefined }));
    expect(html).not.toContain('fs-card-status');
  });

  it('renders details when present', () => {
    const html = renderSuggestionCard(makeSuggestion({ details: 'More detail here' }));
    expect(html).toContain('More detail here');
  });

  it('escapes HTML in title to prevent XSS', () => {
    const html = renderSuggestionCard(makeSuggestion({ title: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
