import type { StorageAdapter } from './adapter';
import type {
  Suggestion,
  SuggestionType,
  SuggestionStatus,
  Comment,
  CreateSuggestionInput,
  WidgetLayout,
} from './types';
import { renderFeedHTML, type SortOption } from './feed';
import { statusToClassName, typeToClassName } from './status';
import {
  renderSubmissionFormHTML,
  validateTitle,
  type SubmissionFormState,
} from './submission';

export type { SortOption };
export type { WidgetLayout };

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface WidgetUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WidgetTheme {
  primaryColor?: string;
  background?: string;
  font?: string;
  colorScheme?: 'light' | 'dark' | 'auto';
}

class FeatureSuggestionsElement extends HTMLElement {
  private _user: WidgetUser | null = null;
  private _theme: WidgetTheme = {};
  private _logo: string | null = null;
  private _adapter: StorageAdapter | null = null;
  private _suggestions: Suggestion[] = [];
  private _loading = false;
  private _sort: SortOption = 'newest';
  private _searchQuery = '';
  private _showForm = false;
  private _formState: SubmissionFormState = {
    title: '',
    details: '',
    type: 'New Feature',
    error: null,
  };
  private _activeSuggestionId: string | null = null;
  private _comments: Comment[] = [];
  private _userVoted = false;
  private _statusError: string | null = null;
  private _root: ShadowRoot;
  private _colorSchemeMedia: MediaQueryList | null = null;
  private _colorSchemeListener: (() => void) | null = null;
  private _layout: WidgetLayout = {};
  private _filterStatus: SuggestionStatus | null = null;
  private _filterType: SuggestionType | null = null;
  private _dialogMode: 'none' | 'detail' | 'form' = 'none';

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['user', 'logo'];
  }

  get user(): WidgetUser | null {
    return this._user;
  }

  set user(value: WidgetUser | null) {
    this._user = value;
    this.renderShell();
  }

  get theme(): WidgetTheme {
    return this._theme;
  }

  set theme(value: WidgetTheme) {
    this._theme = value;
    this.applyTheme();
  }

  get logo(): string | null {
    return this._logo;
  }

  set logo(value: string | null) {
    this._logo = value;
    this.renderShell();
  }

  get layout(): WidgetLayout {
    return this._layout;
  }

  set layout(value: WidgetLayout) {
    this._layout = value;
    this.renderShell();
  }

  set adapter(value: StorageAdapter) {
    this._adapter = value;
    if (this.isConnected) {
      void this.fetchSuggestions();
    }
  }

  get adapter(): StorageAdapter | null {
    return this._adapter;
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    newVal: string | null,
  ): void {
    if (name === 'user') {
      try {
        this._user = newVal ? (JSON.parse(newVal) as WidgetUser) : null;
      } catch {
        this._user = null;
      }
      this.renderShell();
    } else if (name === 'logo') {
      this._logo = newVal;
      this.renderShell();
    }
  }

  connectedCallback(): void {
    this.applyTheme();
    this.renderShell();
    if (this._adapter) {
      void this.fetchSuggestions();
    }
  }

  disconnectedCallback(): void {
    if (this._colorSchemeMedia && this._colorSchemeListener) {
      this._colorSchemeMedia.removeEventListener(
        'change',
        this._colorSchemeListener,
      );
      this._colorSchemeMedia = null;
      this._colorSchemeListener = null;
    }
  }

  private applyTheme(): void {
    const host = this as HTMLElement;
    if (this._theme.primaryColor) {
      host.style.setProperty('--fs-primary-color', this._theme.primaryColor);
    }
    if (this._theme.background) {
      host.style.setProperty('--fs-background', this._theme.background);
    }
    if (this._theme.font) {
      host.style.setProperty('--fs-font', this._theme.font);
    }

    // Tear down any previous media listener before re-applying.
    if (this._colorSchemeMedia && this._colorSchemeListener) {
      this._colorSchemeMedia.removeEventListener(
        'change',
        this._colorSchemeListener,
      );
      this._colorSchemeMedia = null;
      this._colorSchemeListener = null;
    }

    const scheme = this._theme.colorScheme ?? 'auto';

    if (scheme === 'dark') {
      host.setAttribute('data-color-scheme', 'dark');
    } else if (scheme === 'light') {
      host.removeAttribute('data-color-scheme');
    } else {
      // auto: follow prefers-color-scheme media query
      const applyAuto = () => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          host.setAttribute('data-color-scheme', 'dark');
        } else {
          host.removeAttribute('data-color-scheme');
        }
      };
      applyAuto();
      this._colorSchemeMedia = window.matchMedia(
        '(prefers-color-scheme: dark)',
      );
      this._colorSchemeListener = applyAuto;
      this._colorSchemeMedia.addEventListener('change', applyAuto);
    }
  }

  private async fetchSuggestions(): Promise<void> {
    if (!this._adapter) return;
    this._loading = true;
    this.renderFeed();
    try {
      this._suggestions = await this._adapter.getSuggestions();
    } finally {
      this._loading = false;
      this.renderFeed();
    }
  }

  private renderShell(): void {
    this._root.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--fs-font, system-ui, sans-serif);
          background: var(--fs-background, #ffffff);
          color: var(--fs-text-color, #111827);
          /* primary */
          --fs-primary-color: #6366f1;
          /* surfaces */
          --fs-background: #ffffff;
          --fs-surface: #ffffff;
          --fs-surface-elevated: #ffffff;
          --fs-surface-muted: #f3f4f6;
          /* text */
          --fs-text-color: #111827;
          --fs-text-muted: #6b7280;
          --fs-text-strong: #374151;
          /* borders */
          --fs-border: #e5e7eb;
          --fs-border-strong: #d1d5db;
          --fs-border-focus: var(--fs-primary-color);
          /* states */
          --fs-hover-bg: #f9fafb;
          --fs-active-bg: #f3f4f6;
          /* status pills */
          --fs-status-under-review-bg: #f3f4f6;
          --fs-status-under-review-fg: #374151;
          --fs-status-planned-bg: #e0f2fe;
          --fs-status-planned-fg: #0369a1;
          --fs-status-in-progress-bg: #fef3c7;
          --fs-status-in-progress-fg: #d97706;
          --fs-status-completed-bg: #dcfce7;
          --fs-status-completed-fg: #16a34a;
          --fs-status-declined-bg: #fee2e2;
          --fs-status-declined-fg: #dc2626;
          /* type pills */
          --fs-type-new-feature-bg: #ede9fe;
          --fs-type-new-feature-fg: #6d28d9;
          --fs-type-feature-update-bg: #e0f2fe;
          --fs-type-feature-update-fg: #0369a1;
          --fs-type-bug-report-bg: #fef3c7;
          --fs-type-bug-report-fg: #d97706;
          /* error */
          --fs-error-color: #dc2626;
          --fs-error-bg: #fef2f2;
          --fs-error-border: #fecaca;
          /* backdrop / modal */
          --fs-backdrop: rgba(0, 0, 0, 0.45);
          --fs-modal-bg: #ffffff;
          /* radii */
          --fs-radius-sm: 6px;
          --fs-radius-md: 8px;
          --fs-radius-lg: 12px;
          /* spacing */
          --fs-space-1: 4px;
          --fs-space-2: 8px;
          --fs-space-3: 12px;
          --fs-space-4: 16px;
          --fs-space-5: 20px;
          --fs-space-6: 24px;
          /* typography */
          --fs-font: system-ui, sans-serif;
          --fs-font-mono: ui-monospace, SFMono-Regular, monospace;
          --fs-font-size-base: 0.875rem;
          --fs-font-size-heading: 1.125rem;
        }
        :host([data-color-scheme="dark"]) {
          --fs-background: #1e1e2e;
          --fs-surface: #1e1e2e;
          --fs-surface-elevated: #2a2a3c;
          --fs-surface-muted: #2a2a3c;
          --fs-text-color: #e2e8f0;
          --fs-text-muted: #94a3b8;
          --fs-text-strong: #f1f5f9;
          --fs-border: #374151;
          --fs-border-strong: #4b5563;
          --fs-hover-bg: #2a2a3c;
          --fs-active-bg: #374151;
          --fs-status-under-review-bg: #374151;
          --fs-status-under-review-fg: #d1d5db;
          --fs-status-planned-bg: #0c4a6e;
          --fs-status-planned-fg: #bae6fd;
          --fs-status-in-progress-bg: #451a03;
          --fs-status-in-progress-fg: #fde68a;
          --fs-status-completed-bg: #052e16;
          --fs-status-completed-fg: #86efac;
          --fs-status-declined-bg: #450a0a;
          --fs-status-declined-fg: #fca5a5;
          --fs-type-new-feature-bg: #2e1065;
          --fs-type-new-feature-fg: #c4b5fd;
          --fs-type-feature-update-bg: #0c4a6e;
          --fs-type-feature-update-fg: #bae6fd;
          --fs-type-bug-report-bg: #451a03;
          --fs-type-bug-report-fg: #fde68a;
          --fs-error-color: #f87171;
          --fs-error-bg: #450a0a;
          --fs-error-border: #991b1b;
          --fs-backdrop: rgba(0, 0, 0, 0.7);
          --fs-modal-bg: #2a2a3c;
        }
        .fs-shell {
          max-width: ${this._layout.maxFeedWidth ?? 720}px;
          margin: 0 auto;
          padding: var(--fs-space-6);
        }
        .fs-shell--bare {
          padding: 0;
          margin: 0;
          max-width: ${this._layout.maxFeedWidth ?? 720}px;
        }
        .fs-bare-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--fs-space-4);
        }
        .fs-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--fs-space-3);
          margin-bottom: var(--fs-space-6);
          text-align: center;
        }
        .fs-logo { max-height: 48px; object-fit: contain; }
        .fs-tagline { font-size: 1rem; color: var(--fs-text-color); margin: 0; }
        .fs-feed { display: flex; flex-direction: column; gap: 16px; }
        .fs-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .fs-search {
          flex: 1; min-width: 160px; padding: var(--fs-space-2) var(--fs-space-3);
          border: 1px solid var(--fs-border-strong); border-radius: var(--fs-radius-sm);
          font-size: var(--fs-font-size-base); outline: none;
          background: var(--fs-surface); color: var(--fs-text-color);
        }
        .fs-search:focus { border-color: var(--fs-border-focus); }
        .fs-sort-buttons { display: flex; gap: 6px; }
        .fs-sort-btn {
          padding: 6px 14px; border: 1px solid var(--fs-border-strong); border-radius: var(--fs-radius-sm);
          background: var(--fs-surface); color: var(--fs-text-color); font-size: var(--fs-font-size-base); cursor: pointer;
        }
        .fs-sort-btn--active {
          background: var(--fs-primary-color);
          color: #fff; border-color: var(--fs-primary-color);
        }
        .fs-cards { display: flex; flex-direction: column; gap: var(--fs-space-3); }
        .fs-card {
          padding: var(--fs-space-4); border: 1px solid var(--fs-border); border-radius: var(--fs-radius-md);
          cursor: pointer; background: var(--fs-surface);
        }
        .fs-card:hover { border-color: var(--fs-border-focus); background: var(--fs-hover-bg); }
        .fs-card-header { display: flex; gap: var(--fs-space-2); margin-bottom: var(--fs-space-2); }
        .fs-card-type {
          font-size: 0.75rem; padding: 2px var(--fs-space-2); border-radius: 4px;
          background: var(--fs-surface-muted); color: var(--fs-text-strong);
        }
        .fs-card-type--new-feature { background: var(--fs-type-new-feature-bg); color: var(--fs-type-new-feature-fg); }
        .fs-card-type--feature-update { background: var(--fs-type-feature-update-bg); color: var(--fs-type-feature-update-fg); }
        .fs-card-type--bug-report { background: var(--fs-type-bug-report-bg); color: var(--fs-type-bug-report-fg); }
        .fs-card-status {
          font-size: 0.75rem; padding: 2px var(--fs-space-2); border-radius: 4px;
          background: var(--fs-status-under-review-bg); color: var(--fs-status-under-review-fg);
        }
        .fs-card-status--under-review { background: var(--fs-status-under-review-bg); color: var(--fs-status-under-review-fg); }
        .fs-card-status--planned { background: var(--fs-status-planned-bg); color: var(--fs-status-planned-fg); }
        .fs-card-status--in-progress { background: var(--fs-status-in-progress-bg); color: var(--fs-status-in-progress-fg); }
        .fs-card-status--completed { background: var(--fs-status-completed-bg); color: var(--fs-status-completed-fg); }
        .fs-card-status--declined { background: var(--fs-status-declined-bg); color: var(--fs-status-declined-fg); }
        .fs-admin-status {
          display: flex; flex-direction: column; gap: 4px; padding: var(--fs-space-2) 0;
        }
        .fs-admin-status label {
          font-size: var(--fs-font-size-base); font-weight: 500; color: var(--fs-text-strong);
        }
        .fs-status-select {
          padding: 6px var(--fs-space-3); border: 1px solid var(--fs-border-strong); border-radius: var(--fs-radius-sm);
          font-size: var(--fs-font-size-base); font-family: inherit; background: var(--fs-surface-muted);
          color: var(--fs-text-color); cursor: pointer; outline: none;
        }
        .fs-status-select:disabled { opacity: 0.6; cursor: not-allowed; }
        .fs-admin-error { font-size: var(--fs-font-size-base); color: var(--fs-error-color); margin-top: 4px; }
        .fs-card-title { margin: 0 0 6px; font-size: 1rem; font-weight: 600; }
        .fs-card-details { margin: 0 0 var(--fs-space-2); font-size: var(--fs-font-size-base); color: var(--fs-text-muted); }
        .fs-card-meta { display: flex; gap: var(--fs-space-3); font-size: 0.8rem; color: var(--fs-text-muted); }
        .fs-state { padding: 32px; text-align: center; color: var(--fs-text-muted); }
        .fs-btn {
          padding: var(--fs-space-2) var(--fs-space-4); border: none; border-radius: var(--fs-radius-sm);
          font-size: var(--fs-font-size-base); cursor: pointer; font-family: inherit;
        }
        .fs-btn--primary { background: var(--fs-primary-color); color: #fff; }
        .fs-btn--primary:hover { opacity: 0.9; }
        .fs-btn--cancel {
          background: transparent; border: 1px solid var(--fs-border-strong); color: var(--fs-text-color);
        }
        .fs-form {
          background: var(--fs-surface); border: 1px solid var(--fs-border); border-radius: var(--fs-radius-md);
          padding: var(--fs-space-5); margin-bottom: var(--fs-space-6);
        }
        .fs-form-title { margin: 0 0 var(--fs-space-4); font-size: 1rem; font-weight: 600; }
        .fs-form-error {
          color: var(--fs-error-color); background: var(--fs-error-bg); border: 1px solid var(--fs-error-border);
          border-radius: var(--fs-radius-sm); padding: var(--fs-space-2) var(--fs-space-3); margin-bottom: var(--fs-space-3);
          font-size: var(--fs-font-size-base);
        }
        .fs-form-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--fs-space-3); }
        .fs-form-label { font-size: var(--fs-font-size-base); font-weight: 500; color: var(--fs-text-strong); }
        .fs-form-input {
          padding: var(--fs-space-2) var(--fs-space-3); border: 1px solid var(--fs-border-strong); border-radius: var(--fs-radius-sm);
          font-size: var(--fs-font-size-base); font-family: inherit; outline: none;
          background: var(--fs-surface); color: var(--fs-text-color);
        }
        .fs-form-input:focus { border-color: var(--fs-border-focus); }
        .fs-form-input--error { border-color: var(--fs-error-color); }
        .fs-form-textarea { resize: vertical; min-height: 80px; }
        .fs-form-select { background: var(--fs-surface); color: var(--fs-text-color); cursor: pointer; }
        .fs-form-actions { display: flex; gap: var(--fs-space-2); margin-top: var(--fs-space-4); }
        .fs-dialog-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--fs-space-4);
          background: var(--fs-backdrop);
          z-index: 100;
        }
        .fs-dialog {
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-4);
          padding: var(--fs-space-6);
          border: 1px solid var(--fs-border);
          border-radius: var(--fs-radius-lg);
          background: var(--fs-modal-bg);
          color: var(--fs-text-color);
          outline: none;
        }
        .fs-dialog-header {
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-2);
          padding-right: 40px;
        }
        .fs-dialog-badges {
          display: flex;
          gap: var(--fs-space-2);
          flex-wrap: wrap;
        }
        .fs-dialog-title {
          margin: 0;
          font-size: var(--fs-font-size-heading);
          font-weight: 600;
          line-height: 1.3;
        }
        .fs-dialog-byline {
          font-size: 0.8rem;
          color: var(--fs-text-muted);
        }
        .fs-dialog-close {
          position: absolute;
          top: var(--fs-space-4);
          right: var(--fs-space-4);
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--fs-text-muted);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
        }
        .fs-comments-root {
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-4);
        }
        .fs-comments-list {
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-2);
        }
        .fs-comment {
          padding-top: var(--fs-space-2);
          border-top: 1px solid var(--fs-surface-muted);
        }
        .fs-comment:first-child {
          padding-top: 0;
          border-top: none;
        }
        .fs-comment-meta {
          font-size: 0.8rem;
          color: var(--fs-text-muted);
        }
        .fs-comment-body {
          margin-top: 4px;
          font-size: var(--fs-font-size-base);
          color: var(--fs-text-color);
        }
        .fs-comment--admin {
          border-left: 3px solid var(--fs-primary-color);
          padding-left: var(--fs-space-3);
          background: var(--fs-surface-muted);
          border-radius: 0 var(--fs-radius-sm) var(--fs-radius-sm) 0;
        }
        .fs-comment-admin-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--fs-primary-color);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .fs-locked-notice {
          font-size: var(--fs-font-size-base);
          color: var(--fs-text-muted);
          padding: var(--fs-space-2) var(--fs-space-3);
          background: var(--fs-surface-muted);
          border-radius: var(--fs-radius-sm);
        }
        .fs-comment-form {
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-2);
        }
        .fs-filter-pills {
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-2);
          margin-bottom: var(--fs-space-3);
        }
        .fs-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: var(--fs-space-1);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .fs-pill-group::-webkit-scrollbar { display: none; }
        .fs-filter-pill {
          padding: 4px 12px;
          border: 1px solid var(--fs-border-strong);
          border-radius: 999px;
          background: var(--fs-surface);
          color: var(--fs-text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
        }
        .fs-filter-pill:hover { border-color: var(--fs-border-focus); color: var(--fs-text-color); }
        .fs-filter-pill--active {
          background: var(--fs-primary-color);
          color: #fff;
          border-color: var(--fs-primary-color);
        }
        @media (max-width: ${this._layout.mobileBreakpoint ?? 640}px) {
          .fs-dialog-overlay {
            padding: 0;
            align-items: ${(this._layout.mobileDialogStyle ?? 'fullscreen') === 'center' ? 'center' : 'flex-end'};
          }
          .fs-dialog {
            max-width: 100%;
            max-height: ${(this._layout.mobileDialogStyle ?? 'fullscreen') === 'center' ? '80vh' : '90vh'};
            border-bottom-left-radius: ${(this._layout.mobileDialogStyle ?? 'fullscreen') === 'center' ? 'var(--fs-radius-lg)' : '0'};
            border-bottom-right-radius: ${(this._layout.mobileDialogStyle ?? 'fullscreen') === 'center' ? 'var(--fs-radius-lg)' : '0'};
          }
        }
      </style>
      <div class="fs-shell${this._layout.bare ? ' fs-shell--bare' : ''}">
        ${
          this._layout.bare
            ? `<div class="fs-bare-bar">
          <button id="fs-new-btn" class="fs-btn fs-btn--primary">+ New Suggestion</button>
        </div>`
            : `<div class="fs-header">
          ${this._logo ? `<img class="fs-logo" src="${this._logo}" alt="Logo" />` : ''}
          <p class="fs-tagline">Let us know how we can improve...</p>
          <button id="fs-new-btn" class="fs-btn fs-btn--primary">+ New Suggestion</button>
        </div>`
        }
        <div id="fs-form-root"></div>
        <div id="fs-feed-root"></div>
        <div id="fs-dialog-root"></div>
      </div>
    `;
    this.renderFeed();
    this.renderFormSection();
    this.bindShellEvents();
  }

  private renderFeed(): void {
    const container = this._root.getElementById('fs-feed-root');
    if (!container) return;
    container.innerHTML = renderFeedHTML(
      this._suggestions,
      this._loading,
      this._sort,
      this._searchQuery,
      this._layout.filterStyle ?? 'pill-row',
      this._filterStatus,
      this._filterType,
    );
    this.bindFeedEvents();
  }

  private renderDialogRoot(): void {
    const container = this._root.getElementById('fs-dialog-root');
    if (!container) return;
    if (this._dialogMode === 'none') {
      container.innerHTML = '';
      return;
    }
    if (this._dialogMode === 'form') {
      this.renderFormDialog(container);
      return;
    }
    // 'detail'
    this.renderDetailDialog(container);
  }

  private renderDetailDialog(container: HTMLElement): void {
    if (!this._activeSuggestionId) {
      container.innerHTML = '';
      return;
    }

    const s = this._suggestions.find(x => x.id === this._activeSuggestionId);
    if (!s) {
      container.innerHTML = '';
      return;
    }

    const isLocked = s.status === 'Completed' || s.status === 'Declined';

    const commentsHtml = this._comments
      .map(c => {
        const isAdmin = c.is_admin_response === true;
        return `<div class="fs-comment${isAdmin ? ' fs-comment--admin' : ''}">
          ${isAdmin ? '<div class="fs-comment-admin-badge">Admin Response</div>' : ''}
          <div class="fs-comment-meta"><strong>${escapeHtml(c.authorName)}</strong> · <span class="fs-comment-time">${escapeHtml(c.createdAt.toISOString())}</span></div>
          <div class="fs-comment-body">${escapeHtml(c.body)}</div>
        </div>`;
      })
      .join('');

    const details = s.details?.trim() || 'No additional details provided.';

    const voteSection = isLocked
      ? `<div class="fs-locked-notice">This suggestion is closed.</div>`
      : `<button id="fs-upvote-btn" class="fs-btn fs-btn--primary" type="button">↑ ${s.voteCount} votes${this._userVoted ? ' · voted' : ''}</button>`;

    const commentFormHtml = isLocked
      ? ''
      : `<form id="fs-comment-form" class="fs-comment-form">
          <textarea id="fs-comment-body" class="fs-form-input fs-form-textarea" placeholder="Add a comment"></textarea>
          <div class="fs-form-actions"><button type="submit" class="fs-btn fs-btn--primary">Comment</button></div>
        </form>`;

    container.innerHTML = `
      <div class="fs-dialog-overlay" id="fs-dialog-overlay" role="presentation">
        <div
          class="fs-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fs-dialog-title"
          aria-describedby="fs-dialog-details"
          tabindex="-1"
        >
          <button
            id="fs-dialog-close"
            class="fs-dialog-close"
            type="button"
            aria-label="Close dialog"
          >
            ✕
          </button>
          <div class="fs-dialog-header">
            <div class="fs-dialog-badges">
              <span class="fs-card-type fs-card-type--${typeToClassName(s.type)}">${escapeHtml(s.type)}</span>
              ${s.status ? `<span class="fs-card-status fs-card-status--${statusToClassName(s.status)}">${escapeHtml(s.status)}</span>` : ''}
            </div>
            <h2 class="fs-dialog-title" id="fs-dialog-title">${escapeHtml(s.title)}</h2>
            <div class="fs-dialog-byline">Suggested by ${escapeHtml(s.authorName)}</div>
          </div>
          <p class="fs-card-details" id="fs-dialog-details">${escapeHtml(details)}</p>
          <div class="fs-card-meta">
            ${voteSection}
            <span class="fs-card-comments">&#x1F4AC; ${s.commentCount} comments</span>
          </div>

          <div class="fs-comments-root">
            <h3>Comments (${this._comments.length})</h3>
            <div class="fs-comments-list">${commentsHtml || '<div class="fs-state">No comments yet.</div>'}</div>
            ${commentFormHtml}
          </div>
        </div>
      </div>
    `;

    this.bindDetailEvents();

    container.querySelector<HTMLElement>('.fs-dialog')?.focus();
  }

  private renderFormDialog(container: HTMLElement): void {
    container.innerHTML = `
      <div class="fs-dialog-overlay" id="fs-dialog-overlay" role="presentation">
        <div
          class="fs-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fs-form-dialog-title"
          tabindex="-1"
        >
          <button
            id="fs-dialog-close"
            class="fs-dialog-close"
            type="button"
            aria-label="Close dialog"
          >
            ✕
          </button>
          ${renderSubmissionFormHTML(this._formState)}
        </div>
      </div>
    `;

    const closeFormDialog = () => {
      this._dialogMode = 'none';
      this._formState = {
        title: '',
        details: '',
        type: 'New Feature',
        error: null,
      };
      this.renderDialogRoot();
    };

    container
      .querySelector('#fs-dialog-close')
      ?.addEventListener('click', closeFormDialog);
    container
      .querySelector('#fs-dialog-overlay')
      ?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeFormDialog();
      });
    container.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFormDialog();
      }
    });

    this.bindFormEvents();
    container.querySelector<HTMLElement>('.fs-dialog')?.focus();
  }

  private async openDetail(suggestionId: string): Promise<void> {
    if (!this._adapter) return;

    // Emit composed event — host can intercept (preventDefault) to use its own dialog
    const openEvent = new CustomEvent('fs:open-detail', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { suggestionId },
    });
    if (!this.dispatchEvent(openEvent)) return; // host handles the dialog

    this._activeSuggestionId = suggestionId;
    this._dialogMode = 'detail';
    this._comments = [];
    this._userVoted = false;
    this._statusError = null;

    // Render immediately with optimistic unvoted state (no 404 blocks the dialog open)
    this.renderDialogRoot();

    // Fetch comments and vote state in parallel
    try {
      const [comments, vote] = await Promise.all([
        this._adapter.getComments(suggestionId),
        this._user
          ? this._adapter.getVote(suggestionId, this._user.id)
          : Promise.resolve(null),
      ]);
      this._comments = comments;
      // getVote returns null on 404 (no vote) — treated as unvoted, no error
      this._userVoted = vote !== null;
    } catch {
      this._comments = [];
      this._userVoted = false;
    }

    // Re-render with loaded data only if this dialog is still open
    if (this._activeSuggestionId === suggestionId) {
      this.renderDialogRoot();
    }
  }

  private closeDetail(): void {
    this._activeSuggestionId = null;
    this._dialogMode = 'none';
    this._comments = [];
    this._userVoted = false;
    this._statusError = null;
    this.renderDialogRoot();
  }

  private bindDetailEvents(): void {
    const dialogRoot = this._root.getElementById('fs-dialog-root');
    if (!dialogRoot) return;

    dialogRoot
      .querySelector('#fs-dialog-overlay')
      ?.addEventListener('click', event => {
        if (event.target === event.currentTarget) {
          this.closeDetail();
        }
      });

    dialogRoot.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeDetail();
      }
    });

    dialogRoot
      .querySelector('#fs-dialog-close')
      ?.addEventListener('click', () => this.closeDetail());

    const upvoteBtn =
      dialogRoot.querySelector<HTMLButtonElement>('#fs-upvote-btn');
    upvoteBtn?.addEventListener('click', async () => {
      if (!this._adapter || !this._user || !this._activeSuggestionId) return;
      const id = this._activeSuggestionId;
      const suggestion = this._suggestions.find(s => s.id === id);
      if (!suggestion) return;
      if (this._userVoted) {
        await this._adapter.removeVote(id, this._user.id);
        suggestion.voteCount = Math.max(0, suggestion.voteCount - 1);
        this._userVoted = false;
      } else {
        await this._adapter.addVote(id, this._user.id);
        suggestion.voteCount = suggestion.voteCount + 1;
        this._userVoted = true;
      }
      this.renderFeed();
      this.renderDialogRoot();
    });

    const commentForm =
      dialogRoot.querySelector<HTMLFormElement>('#fs-comment-form');
    commentForm?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!this._adapter || !this._user || !this._activeSuggestionId) return;
      const textarea =
        commentForm.querySelector<HTMLTextAreaElement>('#fs-comment-body');
      const body = textarea?.value?.trim() ?? '';
      if (!body) return;
      const added = await this._adapter.addComment(this._activeSuggestionId!, {
        authorId: this._user.id,
        authorName: this._user.name,
        body,
      });
      this._comments.push(added);
      const suggestion = this._suggestions.find(
        s => s.id === this._activeSuggestionId,
      );
      if (suggestion) suggestion.commentCount = suggestion.commentCount + 1;
      this.renderFeed();
      this.renderDialogRoot();
    });
  }

  private renderFormSection(): void {
    const container = this._root.getElementById('fs-form-root');
    if (!container) return;
    if (!this._showForm) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = renderSubmissionFormHTML(this._formState);
    this.bindFormEvents();
  }

  private bindShellEvents(): void {
    this._root.getElementById('fs-new-btn')?.addEventListener('click', () => {
      const formMode = this._layout.formMode ?? 'modal';
      if (formMode === 'inline') {
        this._showForm = true;
        this._formState = {
          title: '',
          details: '',
          type: 'New Feature',
          error: null,
        };
        this.renderFormSection();
      } else {
        // Modal mode: emit composed event so host can intercept and use its own dialog
        const event = new CustomEvent('fs:open-form', {
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        if (!this.dispatchEvent(event)) return; // host handles the dialog
        this._dialogMode = 'form';
        this._formState = {
          title: '',
          details: '',
          type: 'New Feature',
          error: null,
        };
        this.renderDialogRoot();
      }
    });
  }

  private bindFeedEvents(): void {
    const search = this._root.querySelector<HTMLInputElement>('.fs-search');
    search?.addEventListener('input', e => {
      const input = e.target as HTMLInputElement;
      const cursor = input.selectionStart;
      this._searchQuery = input.value;
      this.renderFeed();
      const newInput = this._root.querySelector<HTMLInputElement>('.fs-search');
      if (newInput && cursor !== null) {
        newInput.focus();
        newInput.setSelectionRange(cursor, cursor);
      }
    });

    this._root
      .querySelectorAll<HTMLButtonElement>('.fs-sort-btn')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          this._sort = btn.dataset['sort'] as SortOption;
          this.renderFeed();
        });
      });

    // Filter pills — status
    this._root
      .querySelectorAll<HTMLButtonElement>('[data-filter-status]')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset['filterStatus'] as SuggestionStatus | '';
          this._filterStatus = val || null;
          this.renderFeed();
        });
      });

    // Filter pills — type
    this._root
      .querySelectorAll<HTMLButtonElement>('[data-filter-type]')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset['filterType'] as SuggestionType | '';
          this._filterType = val || null;
          this.renderFeed();
        });
      });

    // open detail on card click / keyboard
    this._root.querySelectorAll<HTMLElement>('.fs-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset['id'];
        if (id) void this.openDetail(id);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = card.dataset['id'];
          if (id) void this.openDetail(id);
        }
      });
    });
  }

  private bindFormEvents(): void {
    const form = this._root.querySelector<HTMLFormElement>('.fs-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const titleInput = form.querySelector<HTMLInputElement>('#fs-title');
      const detailsInput =
        form.querySelector<HTMLTextAreaElement>('#fs-details');
      const typeSelect = form.querySelector<HTMLSelectElement>('#fs-type');

      const title = titleInput?.value ?? '';
      const details = detailsInput?.value ?? '';
      const type = (typeSelect?.value ?? 'New Feature') as SuggestionType;

      const error = validateTitle(title);
      if (error) {
        this._formState = { title, details, type, error };
        if (this._dialogMode === 'form') {
          this.renderDialogRoot();
        } else {
          this.renderFormSection();
        }
        return;
      }

      if (!this._adapter || !this._user) return;
      void this._doSubmit({ title, details, type });
    });

    form.querySelector('.fs-btn--cancel')?.addEventListener('click', () => {
      this._formState = {
        title: '',
        details: '',
        type: 'New Feature',
        error: null,
      };
      if (this._dialogMode === 'form') {
        this._dialogMode = 'none';
        this.renderDialogRoot();
      } else {
        this._showForm = false;
        this.renderFormSection();
      }
    });
  }

  private async _doSubmit(values: {
    title: string;
    details: string;
    type: SuggestionType;
  }): Promise<void> {
    if (!this._adapter || !this._user) return;
    await this.submitSuggestion({
      title: values.title,
      details: values.details || undefined,
      type: values.type,
      authorId: this._user.id,
      authorName: this._user.name,
    });
  }

  async submitSuggestion(data: CreateSuggestionInput): Promise<void> {
    if (!this._adapter) return;
    const suggestion = await this._adapter.createSuggestion(data);
    this._suggestions = [suggestion, ...this._suggestions];
    this._showForm = false;
    this._dialogMode = 'none';
    this._formState = {
      title: '',
      details: '',
      type: 'New Feature',
      error: null,
    };
    this.renderFeed();
    this.renderFormSection();
    this.renderDialogRoot();
  }

  closeForm(): void {
    this._showForm = false;
    this._dialogMode = 'none';
    this._formState = {
      title: '',
      details: '',
      type: 'New Feature',
      error: null,
    };
    this.renderFormSection();
    this.renderDialogRoot();
  }
}

export function defineWidget(): void {
  if (!customElements.get('feature-suggestions')) {
    customElements.define('feature-suggestions', FeatureSuggestionsElement);
  }
}

export { FeatureSuggestionsElement };

declare global {
  interface HTMLElementTagNameMap {
    'feature-suggestions': FeatureSuggestionsElement;
  }
}
