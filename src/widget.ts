import type { StorageAdapter } from './adapter';

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
    this.render();
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
    this.render();
  }

  set adapter(value: StorageAdapter) {
    this._adapter = value;
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
      this.render();
    } else if (name === 'logo') {
      this._logo = newVal;
      this.render();
    }
  }

  connectedCallback(): void {
    this.applyTheme();
    this.render();
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

  private render(): void {
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
        .fs-logo {
          max-height: 48px;
          object-fit: contain;
        }
        .fs-tagline {
          font-size: 1rem;
          color: var(--fs-text-color, #111827);
          margin: 0;
        }
      </style>
      <div class="fs-shell">
        <div class="fs-header">
          ${this._logo ? `<img class="fs-logo" src="${this._logo}" alt="Logo" />` : ''}
          <p class="fs-tagline">Let us know how we can improve...</p>
        </div>
        <slot></slot>
      </div>
    `;
  }
}

export function defineWidget(): void {
  if (!customElements.get('feature-suggestions')) {
    customElements.define('feature-suggestions', FeatureSuggestionsElement);
  }
}
