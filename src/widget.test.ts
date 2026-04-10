// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineWidget } from './widget';
import type { WidgetUser, WidgetTheme } from './widget';
import type { StorageAdapter } from './adapter';
import type { Suggestion } from './types';

defineWidget();

describe('FeatureSuggestionsElement', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('feature-suggestions');
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it('registers as a custom element without errors', () => {
    expect(customElements.get('feature-suggestions')).toBeDefined();
  });

  it('renders the tagline', () => {
    expect(el.shadowRoot!.innerHTML).toContain('Let us know how we can improve...');
  });

  it('accepts and exposes user property', () => {
    const user: WidgetUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' };
    (el as unknown as { user: WidgetUser }).user = user;
    expect((el as unknown as { user: WidgetUser }).user).toEqual(user);
  });

  it('parses user attribute as JSON', () => {
    const user: WidgetUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'admin' };
    el.setAttribute('user', JSON.stringify(user));
    expect((el as unknown as { user: WidgetUser }).user).toEqual(user);
  });

  it('sets user to null for invalid JSON in user attribute', () => {
    el.setAttribute('user', 'not-json');
    expect((el as unknown as { user: WidgetUser | null }).user).toBeNull();
  });

  it('renders logo above tagline when logo is set', () => {
    (el as unknown as { logo: string }).logo = 'https://example.com/logo.png';
    const img = el.shadowRoot!.querySelector('img.fs-logo');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('https://example.com/logo.png');
  });

  it('does not render logo element when logo is not set', () => {
    expect(el.shadowRoot!.querySelector('img.fs-logo')).toBeNull();
  });

  it('applies primaryColor and background theme CSS custom properties to host', () => {
    const theme: WidgetTheme = { primaryColor: '#ff0000', background: '#f0f0f0' };
    (el as unknown as { theme: WidgetTheme }).theme = theme;
    expect((el as HTMLElement).style.getPropertyValue('--fs-primary-color')).toBe('#ff0000');
    expect((el as HTMLElement).style.getPropertyValue('--fs-background')).toBe('#f0f0f0');
  });

  it('applies font theme CSS custom property to host', () => {
    (el as unknown as { theme: WidgetTheme }).theme = { font: 'Georgia, serif' };
    expect((el as HTMLElement).style.getPropertyValue('--fs-font')).toBe('Georgia, serif');
  });
});

function makeMockAdapter(overrides: Partial<StorageAdapter> = {}): StorageAdapter {
  return {
    getSuggestions: vi.fn().mockResolvedValue([]),
    createSuggestion: vi.fn(),
    setStatus: vi.fn(),
    getVote: vi.fn(),
    addVote: vi.fn(),
    removeVote: vi.fn(),
    getComments: vi.fn(),
    addComment: vi.fn(),
    ...overrides,
  };
}

describe('Suggestion submission form', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('feature-suggestions');
    const user: WidgetUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' };
    (el as unknown as { user: WidgetUser }).user = user;
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it('renders a "New Suggestion" button', () => {
    expect(el.shadowRoot!.getElementById('fs-new-btn')).not.toBeNull();
  });

  it('shows the submission form when "New Suggestion" is clicked', () => {
    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    expect(el.shadowRoot!.querySelector('.fs-form')).not.toBeNull();
  });

  it('form contains title input, details textarea, and type select', () => {
    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    expect(el.shadowRoot!.querySelector('#fs-title')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('#fs-details')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('#fs-type')).not.toBeNull();
  });

  it('hides form when cancel is clicked', () => {
    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    el.shadowRoot!.querySelector<HTMLButtonElement>('.fs-btn--cancel')!.dispatchEvent(new Event('click'));
    expect(el.shadowRoot!.querySelector('.fs-form')).toBeNull();
  });

  it('shows validation error and does not call adapter when title is empty', () => {
    const adapter = makeMockAdapter();
    (el as unknown as { adapter: StorageAdapter }).adapter = adapter;

    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    el.shadowRoot!.querySelector<HTMLFormElement>('.fs-form')!.dispatchEvent(new Event('submit'));

    expect(el.shadowRoot!.querySelector('.fs-form-error')).not.toBeNull();
    expect(adapter.createSuggestion).not.toHaveBeenCalled();
  });

  it('calls adapter.createSuggestion with correct data on valid submit', async () => {
    const newSuggestion: Suggestion = {
      id: 's1',
      title: 'Dark mode',
      type: 'New Feature',
      authorId: 'u1',
      authorName: 'Alice',
      createdAt: new Date(),
      voteCount: 0,
      commentCount: 0,
    };
    const adapter = makeMockAdapter({
      createSuggestion: vi.fn().mockResolvedValue(newSuggestion),
    });
    (el as unknown as { adapter: StorageAdapter }).adapter = adapter;

    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    el.shadowRoot!.querySelector<HTMLInputElement>('#fs-title')!.value = 'Dark mode';
    el.shadowRoot!.querySelector<HTMLFormElement>('.fs-form')!.dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 0));

    expect(adapter.createSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Dark mode', authorId: 'u1', authorName: 'Alice' }),
    );
  });

  it('hides form and adds card to feed after successful submit', async () => {
    const newSuggestion: Suggestion = {
      id: 's1',
      title: 'Dark mode',
      type: 'New Feature',
      authorId: 'u1',
      authorName: 'Alice',
      createdAt: new Date(),
      voteCount: 0,
      commentCount: 0,
    };
    const adapter = makeMockAdapter({
      createSuggestion: vi.fn().mockResolvedValue(newSuggestion),
    });
    (el as unknown as { adapter: StorageAdapter }).adapter = adapter;

    el.shadowRoot!.getElementById('fs-new-btn')!.dispatchEvent(new Event('click'));
    el.shadowRoot!.querySelector<HTMLInputElement>('#fs-title')!.value = 'Dark mode';
    el.shadowRoot!.querySelector<HTMLFormElement>('.fs-form')!.dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 0));

    expect(el.shadowRoot!.querySelector('.fs-form')).toBeNull();
    expect(el.shadowRoot!.innerHTML).toContain('Dark mode');
  });
});
