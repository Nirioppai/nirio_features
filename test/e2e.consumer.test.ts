// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

describe('consumer integration (e2e)', () => {
  it('loads the built ESM bundle and registers the custom element', async () => {
    // import the built ESM bundle from dist
    const mod = await import('../dist/index.esm.js');
    expect(mod).toBeDefined();
    // call defineWidget to register
    mod.defineWidget();
    expect(customElements.get('feature-suggestions')).toBeDefined();

    const el = document.createElement('feature-suggestions');
    document.body.appendChild(el);
    expect(document.body.contains(el)).toBe(true);
  });
});
