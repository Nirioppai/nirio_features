import type { StorageAdapter } from './adapter';
import type { Suggestion, SuggestionType, Comment } from './types';
import { renderFeedHTML, type SortOption } from './feed';
import {
  renderSubmissionFormHTML,
  validateTitle,
  type SubmissionFormState,
} from './submission';

export type { SortOption };

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
  private _root: ShadowRoot;

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
        }
        .fs-shell {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px;
        }
        .fs-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          text-align: center;
        }
        .fs-logo { max-height: 48px; object-fit: contain; }
        .fs-tagline { font-size: 1rem; color: var(--fs-text-color, #111827); margin: 0; }
        .fs-feed { display: flex; flex-direction: column; gap: 16px; }
        .fs-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .fs-search {
          flex: 1; min-width: 160px; padding: 8px 12px;
          border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 0.875rem; outline: none;
        }
        .fs-search:focus { border-color: var(--fs-primary-color, #6366f1); }
        .fs-sort-buttons { display: flex; gap: 6px; }
        .fs-sort-btn {
          padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px;
          background: #fff; font-size: 0.875rem; cursor: pointer;
        }
        .fs-sort-btn--active {
          background: var(--fs-primary-color, #6366f1);
          color: #fff; border-color: var(--fs-primary-color, #6366f1);
        }
        .fs-cards { display: flex; flex-direction: column; gap: 12px; }
        .fs-card {
          padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;
          cursor: pointer; background: #fff;
        }
        .fs-card:hover { border-color: var(--fs-primary-color, #6366f1); }
        .fs-card-header { display: flex; gap: 8px; margin-bottom: 8px; }
        .fs-card-type, .fs-card-status {
          font-size: 0.75rem; padding: 2px 8px; border-radius: 4px;
          background: #f3f4f6; color: #374151;
        }
        .fs-card-status { background: #dbeafe; color: #1d4ed8; }
        .fs-card-title { margin: 0 0 6px; font-size: 1rem; font-weight: 600; }
        .fs-card-details { margin: 0 0 8px; font-size: 0.875rem; color: #6b7280; }
        .fs-card-meta { display: flex; gap: 12px; font-size: 0.8rem; color: #9ca3af; }
        .fs-state { padding: 32px; text-align: center; color: #9ca3af; }
        .fs-btn {
          padding: 8px 16px; border: none; border-radius: 6px;
          font-size: 0.875rem; cursor: pointer; font-family: inherit;
        }
        .fs-btn--primary { background: var(--fs-primary-color, #6366f1); color: #fff; }
        .fs-btn--primary:hover { opacity: 0.9; }
        .fs-btn--cancel {
          background: transparent; border: 1px solid #d1d5db; color: #374151;
        }
        .fs-form {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 20px; margin-bottom: 24px;
        }
        .fs-form-title { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
        .fs-form-error {
          color: #dc2626; background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 6px; padding: 8px 12px; margin-bottom: 12px;
          font-size: 0.875rem;
        }
        .fs-form-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
        .fs-form-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
        .fs-form-input {
          padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 0.875rem; font-family: inherit; outline: none;
        }
        .fs-form-input:focus { border-color: var(--fs-primary-color, #6366f1); }
        .fs-form-input--error { border-color: #dc2626; }
        .fs-form-textarea { resize: vertical; min-height: 80px; }
        .fs-form-select { background: #fff; cursor: pointer; }
        .fs-form-actions { display: flex; gap: 8px; margin-top: 16px; }
      </style>
      <div class="fs-shell">
        <div class="fs-header">
          ${this._logo ? `<img class="fs-logo" src="${this._logo}" alt="Logo" />` : ''}
          <p class="fs-tagline">Let us know how we can improve...</p>
          <button id="fs-new-btn" class="fs-btn fs-btn--primary">+ New Suggestion</button>
        </div>
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
    );
    this.bindFeedEvents();
  }

  private renderDetailDialog(): void {
    const container = this._root.getElementById('fs-dialog-root');
    if (!container) return;
    if (!this._activeSuggestionId) {
      container.innerHTML = '';
      return;
    }

    const s = this._suggestions.find(x => x.id === this._activeSuggestionId);
    if (!s) {
      container.innerHTML = '';
      return;
    }

    const commentsHtml = this._comments
      .map(
        c =>
          `<div class="fs-comment"><div class="fs-comment-meta"><strong>${escapeHtml(c.authorName)}</strong> · <span class="fs-comment-time">${escapeHtml(
            c.createdAt.toISOString(),
          )}</span></div><div class="fs-comment-body">${escapeHtml(c.body)}</div></div>`,
      )
      .join('');

    container.innerHTML = `
      <div class="fs-dialog" role="dialog" aria-modal="true">
        <div class="fs-dialog-content">
          <button id="fs-dialog-close" class="fs-btn fs-btn--cancel">Close</button>
          <h2 class="fs-card-title">${escapeHtml(s.title)}</h2>
          <div class="fs-card-header">
            <span class="fs-card-type">${escapeHtml(s.type)}</span>
            ${s.status ? `<span class="fs-card-status">${escapeHtml(s.status)}</span>` : ''}
          </div>
          ${
            this._user?.role === 'admin'
              ? `
            <div class="fs-admin-status">
              <label for="fs-status-select">Status:</label>
              <select id="fs-status-select" class="fs-form-select">
                <option value="">(none)</option>
                <option value="Under Review" ${s.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                <option value="Planned" ${s.status === 'Planned' ? 'selected' : ''}>Planned</option>
                <option value="In Progress" ${s.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${s.status === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="Declined" ${s.status === 'Declined' ? 'selected' : ''}>Declined</option>
              </select>
            </div>
          `
              : ''
          }
          ${s.details ? `<p class="fs-card-details">${escapeHtml(s.details)}</p>` : ''}
          <div class="fs-card-meta">
            <button id="fs-upvote-btn" class="fs-btn fs-btn--primary">▲ ${s.voteCount}${this._userVoted ? ' (voted)' : ''}</button>
            <span class="fs-card-comments">💬 ${s.commentCount}</span>
            <span class="fs-card-author">by ${escapeHtml(s.authorName)}</span>
          </div>

          <div class="fs-comments-root">
            <h3>Comments</h3>
            <div class="fs-comments-list">${commentsHtml || '<div class="fs-state">No comments yet.</div>'}</div>
            <form id="fs-comment-form" class="fs-comment-form">
              <textarea id="fs-comment-body" class="fs-form-input fs-form-textarea" placeholder="Add a comment"></textarea>
              <div class="fs-form-actions"><button type="submit" class="fs-btn fs-btn--primary">Comment</button></div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindDetailEvents();
  }

  private async openDetail(suggestionId: string): Promise<void> {
    if (!this._adapter) return;
    this._activeSuggestionId = suggestionId;
    // fetch comments and vote state
    try {
      this._comments = await this._adapter.getComments(suggestionId);
      if (this._user) {
        const vote = await this._adapter.getVote(suggestionId, this._user.id);
        this._userVoted = !!vote;
      } else {
        this._userVoted = false;
      }
    } catch {
      this._comments = [];
      this._userVoted = false;
    }
    this.renderDetailDialog();
  }

  private closeDetail(): void {
    this._activeSuggestionId = null;
    this._comments = [];
    this._userVoted = false;
    this.renderDetailDialog();
  }

  private bindDetailEvents(): void {
    const dialogRoot = this._root.getElementById('fs-dialog-root');
    if (!dialogRoot) return;
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
      this.renderDetailDialog();
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
      this.renderDetailDialog();
    });

    // admin status control - visible only when admin rendered the select
    const statusSelect =
      dialogRoot.querySelector<HTMLSelectElement>('#fs-status-select');
    statusSelect?.addEventListener('change', async e => {
      if (!this._adapter || !this._activeSuggestionId) return;
      const val = (e.target as HTMLSelectElement).value;
      if (!val) return;
      try {
        await this._adapter.setStatus(this._activeSuggestionId, val as any);
        const suggestion = this._suggestions.find(
          s => s.id === this._activeSuggestionId,
        );
        if (suggestion) suggestion.status = val as any;
        this.renderFeed();
        this.renderDetailDialog();
      } catch {
        // ignore errors for now
      }
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
      this._showForm = true;
      this._formState = {
        title: '',
        details: '',
        type: 'New Feature',
        error: null,
      };
      this.renderFormSection();
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
        this.renderFormSection();
        return;
      }

      if (!this._adapter || !this._user) return;
      void this.submitSuggestion({ title, details, type });
    });

    form.querySelector('.fs-btn--cancel')?.addEventListener('click', () => {
      this._showForm = false;
      this._formState = {
        title: '',
        details: '',
        type: 'New Feature',
        error: null,
      };
      this.renderFormSection();
    });
  }

  private async submitSuggestion(values: {
    title: string;
    details: string;
    type: SuggestionType;
  }): Promise<void> {
    if (!this._adapter || !this._user) return;
    const suggestion = await this._adapter.createSuggestion({
      title: values.title,
      details: values.details || undefined,
      type: values.type,
      authorId: this._user.id,
      authorName: this._user.name,
    });
    this._suggestions = [suggestion, ...this._suggestions];
    this._showForm = false;
    this._formState = {
      title: '',
      details: '',
      type: 'New Feature',
      error: null,
    };
    this.renderFeed();
    this.renderFormSection();
  }
}

export function defineWidget(): void {
  if (!customElements.get('feature-suggestions')) {
    customElements.define('feature-suggestions', FeatureSuggestionsElement);
  }
}
