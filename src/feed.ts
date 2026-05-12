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
  const typeCls = typeToClassName(s.type);
  const statusBadgeMobile = s.status
    ? `<span class="fs-card-status fs-card-status--${statusToClassName(s.status)} fs-card-status--mobile">${escapeHtml(s.status)}</span>`
    : '';
  const statusBadgeDesktop = s.status
    ? `<span class="fs-card-status fs-card-status--${statusToClassName(s.status)} fs-card-status--desktop">${escapeHtml(s.status)}</span>`
    : '';
  return `
    <div class="fs-card" data-id="${escapeHtml(s.id)}" role="button" tabindex="0">
      <button class="fs-vote-box" data-vote-id="${escapeHtml(s.id)}" aria-pressed="false" type="button">
        <span class="fs-vote-arrow">▲</span>
        <span class="fs-vote-count">${s.voteCount}</span>
      </button>
      <div class="fs-card-body">
        <div class="fs-card-top">
          <span class="fs-card-type fs-card-type--${typeCls}">${escapeHtml(s.type)}</span>
          ${statusBadgeMobile}
        </div>
        <h3 class="fs-card-title">${escapeHtml(s.title)}</h3>
        ${s.details ? `<p class="fs-card-details">${escapeHtml(s.details)}</p>` : ''}
        <div class="fs-card-meta">
          <button class="fs-vote-pill" data-vote-id="${escapeHtml(s.id)}" aria-pressed="false" type="button">▲ ${s.voteCount}</button>
          <span class="fs-card-sep">·</span>
          <span class="fs-card-comments">💬 ${s.commentCount} comments</span>
          <span class="fs-card-sep">·</span>
          <span class="fs-card-author">Suggested by ${escapeHtml(s.authorName)}</span>
          <span class="fs-card-sep">·</span>
          <span class="fs-card-age">${relativeTime(s.createdAt)}</span>
        </div>
      </div>
      ${statusBadgeDesktop}
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

  // Counts from the full (pre-filter) suggestions array for pill badges
  const statusCountMap = new Map<string, number>();
  for (const s of suggestions) {
    const key = s.status ?? '';
    statusCountMap.set(key, (statusCountMap.get(key) ?? 0) + 1);
  }
  const typeCountMap = new Map<string, number>();
  for (const s of suggestions) {
    typeCountMap.set(s.type, (typeCountMap.get(s.type) ?? 0) + 1);
  }
  const totalCount = suggestions.length;

  const sortButtons: Array<{
    value: SortOption;
    desktopLabel: string;
    mobileLabel: string;
  }> = [
    { value: 'newest', desktopLabel: 'Newest', mobileLabel: 'Newest' },
    { value: 'most-voted', desktopLabel: 'Most Voted', mobileLabel: 'Top' },
    { value: 'trending', desktopLabel: 'Trending', mobileLabel: 'Hot' },
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
            <button class="fs-filter-pill${!filterStatus ? ' fs-filter-pill--active' : ''}" data-filter-status="">All<span class="fs-pill-count">· ${totalCount}</span></button>
            ${STATUS_OPTIONS.map(
              s =>
                `<button class="fs-filter-pill${filterStatus === s ? ' fs-filter-pill--active' : ''}" data-filter-status="${escapeHtml(s)}">${escapeHtml(s)}<span class="fs-pill-count">· ${statusCountMap.get(s) ?? 0}</span></button>`,
            ).join('')}
          </div>
          <div class="fs-pill-group" role="group" aria-label="Filter by type">
            <button class="fs-filter-pill${!filterType ? ' fs-filter-pill--active' : ''}" data-filter-type="">All Types</button>
            ${SUGGESTION_TYPES.map(
              t =>
                `<button class="fs-filter-pill${filterType === t ? ' fs-filter-pill--active' : ''}" data-filter-type="${escapeHtml(t)}">${escapeHtml(t)}<span class="fs-pill-count">· ${typeCountMap.get(t) ?? 0}</span></button>`,
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
        <span class="fs-result-count">${visible.length} result${visible.length !== 1 ? 's' : ''}</span>
        <div class="fs-sort-buttons" role="group" aria-label="Sort by">
          ${sortButtons
            .map(
              b =>
                `<button
                  class="fs-sort-btn${sort === b.value ? ' fs-sort-btn--active' : ''}"
                  data-sort="${b.value}"
                ><span class="fs-desktop-label">${b.desktopLabel}</span><span class="fs-mobile-label">${b.mobileLabel}</span></button>`,
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

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
