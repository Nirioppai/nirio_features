// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineWidget } from './widget';
import type { WidgetUser, WidgetTheme } from './widget';

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
