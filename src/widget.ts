import type { StorageAdapter } from './adapter';
import type { Suggestion } from './types';
import { renderFeedHTML, type SortOption } from './feed';

export type { SortOption };

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

  attributeChangedCallback(name: string, _old: string | null, newVal: string | null): void {
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
      </style>
      <div class="fs-shell">
        <div class="fs-header">
          ${this._logo ? `<img class="fs-logo" src="${this._logo}" alt="Logo" />` : ''}
          <p class="fs-tagline">Let us know how we can improve...</p>
        </div>
        <div id="fs-feed-root"></div>
      </div>
    `;
    this.renderFeed();
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

    this._root.querySelectorAll<HTMLButtonElement>('.fs-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sort = btn.dataset['sort'] as SortOption;
        this.renderFeed();
      });
    });
  }
}

export function defineWidget(): void {
  if (!customElements.get('feature-suggestions')) {
    customElements.define('feature-suggestions', FeatureSuggestionsElement);
  }
}
