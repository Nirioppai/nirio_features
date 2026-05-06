// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHttpAdapter } from './http';
import type { StorageAdapter } from '../adapter';

const BASE = 'https://api.example.com';

function makeRes(
  body: unknown,
  init: { status?: number; statusText?: string } = {},
): Response {
  const status = init.status ?? 200;
  const isNullBodyStatus = status === 204 || status === 205 || status === 304;
  const text =
    body === undefined || body === null
      ? ''
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  return new Response(isNullBodyStatus ? null : text, {
    status,
    statusText: init.statusText ?? '',
    headers: { 'content-type': 'application/json' },
  });
}

function makeFetch(
  impl: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  const fn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) =>
    impl(typeof url === 'string' ? url : url.toString(), init ?? {}),
  );
  return fn as typeof fn & {
    mock: { calls: Array<[string, RequestInit]> };
  };
}

function setCookie(value: string) {
  // happy-dom supports document.cookie
  document.cookie = `${value}; path=/`;
}

function clearCookies() {
  if (typeof document === 'undefined' || !document.cookie) return;
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

describe('HttpAdapter', () => {
  let adapter: StorageAdapter;
  let fetchImpl: ReturnType<typeof makeFetch>;

  beforeEach(() => {
    clearCookies();
    fetchImpl = makeFetch(() => makeRes([], {}));
    adapter = createHttpAdapter({ baseUrl: BASE, fetch: fetchImpl });
  });

  afterEach(() => {
    clearCookies();
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────
  // getSuggestions
  // ────────────────────────────────────────────────────────────────────
  describe('getSuggestions', () => {
    it('GETs the resource path and maps snake_case → camelCase + Date', async () => {
      const serverRows = [
        {
          id: 42,
          title: 'Dark mode',
          details: 'Please',
          type: 'New Feature',
          status: 'Planned',
          author_id: 7,
          author_name: 'Alice',
          vote_count: 3,
          comment_count: 1,
          created_at: '2026-05-06T12:34:56+00:00',
        },
      ];
      fetchImpl.mockResolvedValueOnce(makeRes(serverRows));

      const result = await adapter.getSuggestions();

      expect(fetchImpl).toHaveBeenCalledTimes(1);
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions`);
      expect(init.method).toBe('GET');
      expect(init.credentials).toBe('include');
      expect((init.headers as Record<string, string>).Accept).toBe(
        'application/json',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '42',
        title: 'Dark mode',
        details: 'Please',
        type: 'New Feature',
        status: 'Planned',
        authorId: '7',
        authorName: 'Alice',
        voteCount: 3,
        commentCount: 1,
      });
      expect(result[0]!.createdAt).toBeInstanceOf(Date);
      expect(result[0]!.createdAt.toISOString()).toBe(
        '2026-05-06T12:34:56.000Z',
      );
    });

    it('omits details/status when server returns null', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes([
          {
            id: '1',
            title: 't',
            details: null,
            type: 'Bug Report',
            status: null,
            author_id: 'u',
            author_name: 'n',
            vote_count: 0,
            comment_count: 0,
            created_at: '2026-05-06T00:00:00Z',
          },
        ]),
      );
      const [s] = await adapter.getSuggestions();
      expect(s).not.toHaveProperty('details');
      expect(s).not.toHaveProperty('status');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // createSuggestion + CSRF
  // ────────────────────────────────────────────────────────────────────
  describe('createSuggestion', () => {
    it('POSTs body and includes X-XSRF-TOKEN when cookie present', async () => {
      setCookie('XSRF-TOKEN=abc%3D%3D');
      fetchImpl.mockResolvedValueOnce(
        makeRes({
          id: 'new',
          title: 'T',
          details: null,
          type: 'New Feature',
          status: null,
          author_id: 'u',
          author_name: 'n',
          vote_count: 0,
          comment_count: 0,
          created_at: '2026-05-06T00:00:00Z',
        }),
      );

      const out = await adapter.createSuggestion({
        title: 'T',
        type: 'New Feature',
        authorId: 'u',
        authorName: 'n',
      });

      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions`);
      expect(init.method).toBe('POST');
      expect(init.credentials).toBe('include');
      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-XSRF-TOKEN']).toBe('abc==');
      expect(JSON.parse(init.body as string)).toEqual({
        title: 'T',
        details: null,
        type: 'New Feature',
      });
      expect(out.id).toBe('new');
      expect(out.createdAt).toBeInstanceOf(Date);
    });

    it('omits CSRF header when cookie missing', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes({
          id: 'x',
          title: 't',
          details: null,
          type: 'New Feature',
          status: null,
          author_id: 'u',
          author_name: 'n',
          vote_count: 0,
          comment_count: 0,
          created_at: '2026-05-06T00:00:00Z',
        }),
      );
      await adapter.createSuggestion({
        title: 't',
        type: 'New Feature',
        authorId: 'u',
        authorName: 'n',
      });
      const headers = fetchImpl.mock.calls[0]![1].headers as Record<
        string,
        string
      >;
      expect(headers['X-XSRF-TOKEN']).toBeUndefined();
    });

    it('omits CSRF header when csrfCookieName is null', async () => {
      setCookie('XSRF-TOKEN=abc');
      const a = createHttpAdapter({
        baseUrl: BASE,
        fetch: fetchImpl,
        csrfCookieName: null,
      });
      fetchImpl.mockResolvedValueOnce(
        makeRes({
          id: 'x',
          title: 't',
          details: null,
          type: 'New Feature',
          status: null,
          author_id: 'u',
          author_name: 'n',
          vote_count: 0,
          comment_count: 0,
          created_at: '2026-05-06T00:00:00Z',
        }),
      );
      await a.createSuggestion({
        title: 't',
        type: 'New Feature',
        authorId: 'u',
        authorName: 'n',
      });
      const headers = fetchImpl.mock.calls[0]![1].headers as Record<
        string,
        string
      >;
      expect(headers['X-XSRF-TOKEN']).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // setStatus
  // ────────────────────────────────────────────────────────────────────
  describe('setStatus', () => {
    it('PATCHes /{id}/status with { status }', async () => {
      fetchImpl.mockResolvedValueOnce(makeRes(null, { status: 204 }));
      await adapter.setStatus('42', 'Planned');
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/status`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body as string)).toEqual({ status: 'Planned' });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getVote
  // ────────────────────────────────────────────────────────────────────
  describe('getVote', () => {
    it('returns Vote on 200', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes({ suggestion_id: 42, user_id: 7 }),
      );
      const v = await adapter.getVote('42', '7');
      expect(v).toEqual({ suggestionId: '42', userId: '7' });
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/vote`);
      expect(init.method).toBe('GET');
    });

    it('returns null on 404', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes({ message: 'not found' }, { status: 404 }),
      );
      const v = await adapter.getVote('42', '7');
      expect(v).toBeNull();
    });

    it('throws on other errors', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes({ message: 'boom' }, { status: 500 }),
      );
      await expect(adapter.getVote('42', '7')).rejects.toThrow('boom');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // addVote / removeVote
  // ────────────────────────────────────────────────────────────────────
  describe('addVote / removeVote', () => {
    it('addVote POSTs no body and sends CSRF', async () => {
      setCookie('XSRF-TOKEN=tok');
      fetchImpl.mockResolvedValueOnce(makeRes(null, { status: 204 }));
      await adapter.addVote('42', '7');
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/vote`);
      expect(init.method).toBe('POST');
      expect(init.body).toBeUndefined();
      const headers = init.headers as Record<string, string>;
      expect(headers['X-XSRF-TOKEN']).toBe('tok');
      expect(headers['Content-Type']).toBeUndefined();
    });

    it('removeVote DELETEs no body and sends CSRF', async () => {
      setCookie('XSRF-TOKEN=tok');
      fetchImpl.mockResolvedValueOnce(makeRes(null, { status: 204 }));
      await adapter.removeVote('42', '7');
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/vote`);
      expect(init.method).toBe('DELETE');
      expect(init.body).toBeUndefined();
      expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe(
        'tok',
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Comments
  // ────────────────────────────────────────────────────────────────────
  describe('getComments', () => {
    it('GETs comments and maps array', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes([
          {
            id: 1,
            suggestion_id: 42,
            author_id: 7,
            author_name: 'Alice',
            body: 'hi',
            created_at: '2026-05-06T00:00:00Z',
          },
          {
            id: 2,
            suggestion_id: 42,
            author_id: 8,
            author_name: 'Bob',
            body: 'hey',
            created_at: '2026-05-06T01:00:00Z',
          },
        ]),
      );
      const comments = await adapter.getComments('42');
      expect(comments).toHaveLength(2);
      expect(comments[0]).toMatchObject({
        id: '1',
        suggestionId: '42',
        authorId: '7',
        authorName: 'Alice',
        body: 'hi',
      });
      expect(comments[0]!.createdAt).toBeInstanceOf(Date);
      const [url] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/comments`);
    });
  });

  describe('addComment', () => {
    it('POSTs { body } and returns mapped Comment', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes({
          id: 10,
          suggestion_id: 42,
          author_id: 7,
          author_name: 'Alice',
          body: 'hi',
          created_at: '2026-05-06T00:00:00Z',
        }),
      );
      const c = await adapter.addComment('42', {
        authorId: '7',
        authorName: 'Alice',
        body: 'hi',
      });
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions/42/comments`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ body: 'hi' });
      expect(c.id).toBe('10');
      expect(c.suggestionId).toBe('42');
      expect(c.createdAt).toBeInstanceOf(Date);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Error envelope
  // ────────────────────────────────────────────────────────────────────
  describe('errors', () => {
    it('throws Error with server message and exposes .body envelope', async () => {
      fetchImpl.mockResolvedValueOnce(
        makeRes(
          {
            message: 'Validation failed',
            code: 'VALIDATION',
            errors: { title: ['required'] },
          },
          { status: 422 },
        ),
      );
      let caught: unknown;
      try {
        await adapter.createSuggestion({
          title: '',
          type: 'New Feature',
          authorId: 'u',
          authorName: 'n',
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
      const err = caught as Error & { body?: unknown; status?: number };
      expect(err.message).toBe('Validation failed');
      expect(err.status).toBe(422);
      expect(err.body).toMatchObject({
        message: 'Validation failed',
        code: 'VALIDATION',
        errors: { title: ['required'] },
      });
    });

    it('falls back to "HTTP {status}" when no message', async () => {
      fetchImpl.mockResolvedValueOnce(makeRes('', { status: 500 }));
      await expect(adapter.setStatus('1', 'Planned')).rejects.toThrow(
        'HTTP 500',
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // credentials always included
  // ────────────────────────────────────────────────────────────────────
  describe('credentials', () => {
    it('sends credentials: include on every call', async () => {
      fetchImpl.mockResolvedValue(makeRes(null, { status: 204 }));
      await adapter.getSuggestions().catch(() => {});
      await adapter.setStatus('1', 'Planned').catch(() => {});
      await adapter.addVote('1', 'u').catch(() => {});
      await adapter.removeVote('1', 'u').catch(() => {});
      for (const call of fetchImpl.mock.calls) {
        expect(call[1].credentials).toBe('include');
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Config
  // ────────────────────────────────────────────────────────────────────
  describe('config', () => {
    it('strips trailing slash on baseUrl and resourcePath', async () => {
      const a = createHttpAdapter({
        baseUrl: `${BASE}/`,
        resourcePath: '/api/feature-suggestions/',
        fetch: fetchImpl,
      });
      fetchImpl.mockResolvedValueOnce(makeRes([]));
      await a.getSuggestions();
      const [url] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/api/feature-suggestions`);
    });

    it('honors custom resourcePath and csrfHeaderName', async () => {
      setCookie('CSRF-TOKEN=t');
      const a = createHttpAdapter({
        baseUrl: BASE,
        resourcePath: '/v2/ideas',
        csrfCookieName: 'CSRF-TOKEN',
        csrfHeaderName: 'X-Csrf',
        fetch: fetchImpl,
      });
      fetchImpl.mockResolvedValueOnce(makeRes(null, { status: 204 }));
      await a.setStatus('9', 'Planned');
      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe(`${BASE}/v2/ideas/9/status`);
      expect((init.headers as Record<string, string>)['X-Csrf']).toBe('t');
    });

    it('still accepts the deprecated `fetchImpl` alias', async () => {
      // Back-compat: pre-1.1 release-candidate field name.
      const a = createHttpAdapter({ baseUrl: BASE, fetchImpl });
      fetchImpl.mockResolvedValueOnce(makeRes([]));
      await a.getSuggestions();
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('honors a custom `credentials` mode', async () => {
      const a = createHttpAdapter({
        baseUrl: BASE,
        fetch: fetchImpl,
        credentials: 'same-origin',
      });
      fetchImpl.mockResolvedValueOnce(makeRes([]));
      await a.getSuggestions();
      const [, init] = fetchImpl.mock.calls[0]!;
      expect(init.credentials).toBe('same-origin');
    });
  });
});
