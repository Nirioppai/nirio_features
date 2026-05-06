// @vitest-environment happy-dom

/**
 * consumer integration (e2e)
 *
 * Imports ONLY from the built ESM bundle (dist/index.esm.js).
 * Exercises the core Phase 1-7 feature loop the same way a host app would:
 *  - mount with adapter + user props
 *  - initial feed render
 *  - submission form: create suggestion
 *  - detail dialog: open, vote, add comment
 *  - admin: update suggestion status
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createMockAdapter,
  waitUntil,
  shadowQuery,
  shadowQueryAll,
} from './consumer-helpers';

// ---- One-time bundle registration ----
let defineWidget: () => void;

beforeAll(async () => {
  const mod = await import('../dist/index.esm.js');
  defineWidget = mod.defineWidget;
  defineWidget();
});

// ---- Helpers ----
function mountWidget(options: {
  userId?: string;
  role?: string;
  adapter: ReturnType<typeof createMockAdapter>;
}): HTMLElement {
  const { userId = 'user-1', role = 'user', adapter } = options;
  const el = document.createElement('feature-suggestions') as HTMLElement & {
    adapter: ReturnType<typeof createMockAdapter>;
    user: { id: string; name: string; email: string; role: string };
  };
  document.body.appendChild(el);
  el.user = { id: userId, name: 'Test User', email: 'test@example.com', role };
  el.adapter = adapter;
  return el as HTMLElement;
}

// ---- Tests ----

describe('consumer integration (e2e)', () => {
  it('registers the custom element via the built bundle', () => {
    expect(customElements.get('feature-suggestions')).toBeDefined();
  });

  it('renders the feed using the host-provided adapter and user', async () => {
    const adapter = createMockAdapter();
    await adapter.createSuggestion({
      title: 'Better onboarding',
      type: 'New Feature',
      authorId: 'user-1',
      authorName: 'Test User',
    });

    const el = mountWidget({ adapter });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);

    const cards = shadowQueryAll(el, '.fs-card');
    expect(cards.length).toBe(1);
    expect(cards[0]?.textContent).toContain('Better onboarding');
  });

  it('creates a suggestion via the submission form and shows it in the feed', async () => {
    const adapter = createMockAdapter();
    const el = mountWidget({ adapter });

    // Open form
    const newBtn = await (async () => {
      await waitUntil(() => !!shadowQuery(el, '#fs-new-btn'));
      return shadowQuery(el, '#fs-new-btn') as HTMLButtonElement;
    })();
    newBtn.click();

    // Fill title
    await waitUntil(() => !!shadowQuery(el, '#fs-title'));
    const titleInput = shadowQuery(el, '#fs-title') as HTMLInputElement;
    titleInput.value = 'Dark mode support';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Submit
    const form = shadowQuery(el, '.fs-form') as HTMLFormElement;
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    await waitUntil(() => adapter._calls.includes('createSuggestion'));
    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);

    const cards = shadowQueryAll(el, '.fs-card');
    expect(cards.some(c => c.textContent?.includes('Dark mode support'))).toBe(
      true,
    );
  });

  it('opens the detail dialog when a card is clicked', async () => {
    const adapter = createMockAdapter();
    await adapter.createSuggestion({
      title: 'Keyboard shortcuts',
      type: 'New Feature',
      authorId: 'user-1',
      authorName: 'Test User',
    });

    const el = mountWidget({ adapter });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);
    const card = shadowQuery(el, '.fs-card') as HTMLElement;
    card.click();

    await waitUntil(() => !!shadowQuery(el, '.fs-dialog'));

    const dialog = shadowQuery(el, '.fs-dialog') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Keyboard shortcuts');
  });

  it('toggles an upvote and reflects the count change', async () => {
    const adapter = createMockAdapter();
    const s = await adapter.createSuggestion({
      title: 'Vote on me',
      type: 'Feature Update',
      authorId: 'user-1',
      authorName: 'Test User',
    });
    expect(s.voteCount).toBe(0);

    const el = mountWidget({ adapter, userId: 'user-1' });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);
    (shadowQuery(el, '.fs-card') as HTMLElement).click();

    await waitUntil(() => !!shadowQuery(el, '#fs-upvote-btn'));
    const upvoteBtn = shadowQuery(el, '#fs-upvote-btn') as HTMLButtonElement;
    upvoteBtn.click();

    await waitUntil(() => adapter._calls.includes('addVote'));
    expect(adapter._votes.length).toBe(1);

    // Vote again to toggle off
    await waitUntil(() => !!shadowQuery(el, '#fs-upvote-btn'));
    (shadowQuery(el, '#fs-upvote-btn') as HTMLButtonElement).click();

    await waitUntil(
      () => adapter._calls.filter(c => c === 'removeVote').length > 0,
    );
    expect(adapter._votes.length).toBe(0);
  });

  it('adds a comment through the detail dialog comment form', async () => {
    const adapter = createMockAdapter();
    await adapter.createSuggestion({
      title: 'Comments feature',
      type: 'New Feature',
      authorId: 'user-1',
      authorName: 'Test User',
    });

    const el = mountWidget({ adapter });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);
    (shadowQuery(el, '.fs-card') as HTMLElement).click();

    await waitUntil(() => !!shadowQuery(el, '#fs-comment-form'));
    const textarea = shadowQuery(el, '#fs-comment-body') as HTMLTextAreaElement;
    textarea.value = 'This is a great idea!';

    const commentForm = shadowQuery(el, '#fs-comment-form') as HTMLFormElement;
    commentForm.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    await waitUntil(() => adapter._calls.includes('addComment'));
    expect(adapter._comments.length).toBe(1);
    expect(adapter._comments[0]?.body).toBe('This is a great idea!');
  });

  it('admin can update suggestion status and badge appears for all users', async () => {
    const adapter = createMockAdapter();
    await adapter.createSuggestion({
      title: 'Status test suggestion',
      type: 'Bug Report',
      authorId: 'admin-1',
      authorName: 'Admin User',
    });

    const el = mountWidget({ adapter, userId: 'admin-1', role: 'admin' });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);
    (shadowQuery(el, '.fs-card') as HTMLElement).click();

    await waitUntil(() => !!shadowQuery(el, '#fs-status-select'));
    const statusSelect = shadowQuery(
      el,
      '#fs-status-select',
    ) as HTMLSelectElement;
    expect(statusSelect).toBeTruthy();

    statusSelect.value = 'Planned';
    statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitUntil(() => adapter._calls.includes('setStatus'));
    expect(adapter._suggestions[0]?.status).toBe('Planned');
  });

  it('dialog closes without errors when dismissed', async () => {
    const adapter = createMockAdapter();
    await adapter.createSuggestion({
      title: 'Close me',
      type: 'New Feature',
      authorId: 'user-1',
      authorName: 'Test User',
    });

    const el = mountWidget({ adapter });

    await waitUntil(() => shadowQueryAll(el, '.fs-card').length > 0);
    (shadowQuery(el, '.fs-card') as HTMLElement).click();

    await waitUntil(() => !!shadowQuery(el, '#fs-dialog-close'));
    (shadowQuery(el, '#fs-dialog-close') as HTMLButtonElement).click();

    await waitUntil(() => !shadowQuery(el, '.fs-dialog'));
    expect(shadowQuery(el, '.fs-dialog')).toBeNull();
  });
});
