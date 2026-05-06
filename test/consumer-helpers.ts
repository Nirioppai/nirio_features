/**
 * consumer-helpers.ts
 * Shared host-app test adapter and DOM helpers for dist-bundle integration tests.
 * Implements StorageAdapter in-memory so no Firebase config is needed.
 */

import type { StorageAdapter } from '../src/adapter';
import type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionStatus,
} from '../src/types';

let _idCounter = 1;
function nextId(): string {
  return String(_idCounter++);
}

export function createMockAdapter(): StorageAdapter & {
  _suggestions: Suggestion[];
  _votes: Vote[];
  _comments: Comment[];
  _calls: string[];
} {
  const suggestions: Suggestion[] = [];
  const votes: Vote[] = [];
  const comments: Comment[] = [];
  const calls: string[] = [];

  return {
    _suggestions: suggestions,
    _votes: votes,
    _comments: comments,
    _calls: calls,

    async getSuggestions(): Promise<Suggestion[]> {
      calls.push('getSuggestions');
      return [...suggestions];
    },

    async createSuggestion(input: CreateSuggestionInput): Promise<Suggestion> {
      calls.push('createSuggestion');
      const s: Suggestion = {
        id: nextId(),
        title: input.title,
        details: input.details,
        type: input.type,
        status: undefined,
        authorId: input.authorId,
        authorName: input.authorName,
        createdAt: new Date(),
        voteCount: 0,
        commentCount: 0,
      };
      suggestions.push(s);
      return s;
    },

    async setStatus(id: string, status: SuggestionStatus): Promise<void> {
      calls.push('setStatus');
      const s = suggestions.find(x => x.id === id);
      if (s) s.status = status;
    },

    async getVote(suggestionId: string, userId: string): Promise<Vote | null> {
      calls.push('getVote');
      return (
        votes.find(
          v => v.suggestionId === suggestionId && v.userId === userId,
        ) ?? null
      );
    },

    async addVote(suggestionId: string, userId: string): Promise<void> {
      calls.push('addVote');
      if (
        !votes.find(v => v.suggestionId === suggestionId && v.userId === userId)
      ) {
        votes.push({ suggestionId, userId });
        const s = suggestions.find(x => x.id === suggestionId);
        if (s) s.voteCount += 1;
      }
    },

    async removeVote(suggestionId: string, userId: string): Promise<void> {
      calls.push('removeVote');
      const idx = votes.findIndex(
        v => v.suggestionId === suggestionId && v.userId === userId,
      );
      if (idx !== -1) {
        votes.splice(idx, 1);
        const s = suggestions.find(x => x.id === suggestionId);
        if (s) s.voteCount = Math.max(0, s.voteCount - 1);
      }
    },

    async getComments(suggestionId: string): Promise<Comment[]> {
      calls.push('getComments');
      return comments.filter(c => c.suggestionId === suggestionId);
    },

    async addComment(
      suggestionId: string,
      input: CreateCommentInput,
    ): Promise<Comment> {
      calls.push('addComment');
      const c: Comment = {
        id: nextId(),
        suggestionId,
        authorId: input.authorId,
        authorName: input.authorName,
        body: input.body,
        createdAt: new Date(),
      };
      comments.push(c);
      const s = suggestions.find(x => x.id === suggestionId);
      if (s) s.commentCount += 1;
      return c;
    },
  };
}

/**
 * Wait until a predicate returns truthy, polling every 10ms.
 */
export async function waitUntil(
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('waitUntil timed out');
    }
    await new Promise(r => setTimeout(r, 10));
  }
}

/**
 * Query inside a custom element's shadow root.
 */
export function shadowQuery(el: Element, selector: string): Element | null {
  return (
    (el as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot?.querySelector(
      selector,
    ) ?? null
  );
}

/**
 * Query all inside a custom element's shadow root.
 */
export function shadowQueryAll(el: Element, selector: string): Element[] {
  return Array.from(
    (
      el as HTMLElement & { shadowRoot: ShadowRoot }
    ).shadowRoot?.querySelectorAll(selector) ?? [],
  );
}
