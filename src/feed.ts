import type { Suggestion, SuggestionStatus, SuggestionType } from './types';
import { STATUS_OPTIONS, statusToClassName, typeToClassName } from './status';

export type SortOption = 'trending' | 'most-voted' | 'newest';

export function sortSuggestions(
  suggestions: Suggestion[],
  sort: SortOption,
): Suggestion[] {
  const copy = [...suggestions];
  switch (sort) {
    case 'trending':
      return copy.sort((a, b) => b.commentCount - a.commentCount);
    case 'most-voted':
      return copy.sort((a, b) => b.voteCount - a.voteCount);
    case 'newest':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export function filterSuggestions(
  suggestions: Suggestion[],
  query: string,
): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return suggestions;
  return suggestions.filter(
    s =>
      s.title.toLowerCase().includes(q) ||
      (s.details ?? '').toLowerCase().includes(q),
  );
}

export function filterByStatus(
  suggestions: Suggestion[],
  status: SuggestionStatus | null,
): Suggestion[] {
  if (!status) return suggestions;
  return suggestions.filter(s => s.status === status);
}

export function filterByType(
  suggestions: Suggestion[],
  type: SuggestionType | null,
): Suggestion[] {
  if (!type) return suggestions;
  return suggestions.filter(s => s.type === type);
}

export function renderSuggestionCard(s: Suggestion): string {
  return `
    <div class="fs-card" data-id="${s.id}" role="button" tabindex="0">
      <div class="fs-card-header">
        <span class="fs-card-type fs-card-type--${typeToClassName(s.type)}">${escapeHtml(s.type)}</span>
        ${s.status ? `<span class="fs-card-status fs-card-status--${statusToClassName(s.status)}">${escapeHtml(s.status)}</span>` : ''}
      </div>
      <h3 class="fs-card-title">${escapeHtml(s.title)}</h3>
      ${s.details ? `<p class="fs-card-details">${escapeHtml(s.details)}</p>` : ''}
      <div class="fs-card-meta">
        <span class="fs-card-votes">▲ ${s.voteCount}</span>
        <span class="fs-card-comments">💬 ${s.commentCount}</span>
        <span class="fs-card-author">by ${escapeHtml(s.authorName)}</span>
      </div>
    </div>
  `;
}

export function renderFeedHTML(
  suggestions: Suggestion[],
  loading: boolean,
  sort: SortOption,
  searchQuery: string,
  filterStyle: 'dropdown' | 'pill-row' = 'pill-row',
  filterStatus: SuggestionStatus | null = null,
  filterType: SuggestionType | null = null,
): string {
  if (loading) {
    return '<div class="fs-state fs-loading">Loading suggestions...</div>';
  }

  const visible = filterSuggestions(
    filterByType(
      filterByStatus(sortSuggestions(suggestions, sort), filterStatus),
      filterType,
    ),
    searchQuery,
  );

  const sortButtons: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: 'Newest' },
    { value: 'most-voted', label: 'Most Voted' },
    { value: 'trending', label: 'Trending' },
  ];

  const SUGGESTION_TYPES: SuggestionType[] = [
    'New Feature',
    'Feature Update',
    'Bug Report',
  ];

  const filterPillsHtml =
    filterStyle === 'pill-row'
      ? `<div class="fs-filter-pills">
          <div class="fs-pill-group" role="group" aria-label="Filter by status">
            <button class="fs-filter-pill${!filterStatus ? ' fs-filter-pill--active' : ''}" data-filter-status="">All</button>
            ${STATUS_OPTIONS.map(
              s =>
                `<button class="fs-filter-pill${filterStatus === s ? ' fs-filter-pill--active' : ''}" data-filter-status="${escapeHtml(s)}">${escapeHtml(s)}</button>`,
            ).join('')}
          </div>
          <div class="fs-pill-group" role="group" aria-label="Filter by type">
            <button class="fs-filter-pill${!filterType ? ' fs-filter-pill--active' : ''}" data-filter-type="">All Types</button>
            ${SUGGESTION_TYPES.map(
              t =>
                `<button class="fs-filter-pill${filterType === t ? ' fs-filter-pill--active' : ''}" data-filter-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`,
            ).join('')}
          </div>
        </div>`
      : '';

  return `
    <div class="fs-feed">
      ${filterPillsHtml}
      <div class="fs-controls">
        <input
          class="fs-search"
          type="search"
          placeholder="Search suggestions..."
          value="${escapeHtml(searchQuery)}"
          aria-label="Search suggestions"
        />
        <div class="fs-sort-buttons" role="group" aria-label="Sort by">
          ${sortButtons
            .map(
              b =>
                `<button
                  class="fs-sort-btn${sort === b.value ? ' fs-sort-btn--active' : ''}"
                  data-sort="${b.value}"
                >${b.label}</button>`,
            )
            .join('')}
        </div>
      </div>
      ${
        visible.length === 0
          ? '<div class="fs-state fs-empty">No suggestions found.</div>'
          : `<div class="fs-cards">${visible.map(renderSuggestionCard).join('')}</div>`
      }
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
