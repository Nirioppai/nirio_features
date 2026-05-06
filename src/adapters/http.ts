import type { StorageAdapter } from '../adapter';
import type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionStatus,
  SuggestionType,
} from '../types';

export interface HttpAdapterConfig {
  /** Base URL of the host API, e.g. 'https://api.example.com' (no trailing slash). */
  baseUrl: string;
  /** Path prefix for the resource. Default: '/api/feature-suggestions'. */
  resourcePath?: string;
  /**
   * Optional fetch override (for testing / SSR / custom transports).
   * Defaults to `globalThis.fetch`.
   */
  fetch?: typeof fetch;
  /**
   * @deprecated Use `fetch` instead. Kept for back-compat with pre-1.1
   * release candidates; will be removed in a future major.
   */
  fetchImpl?: typeof fetch;
  /**
   * Credentials mode for every request. Default: `'include'` (so cookie
   * sessions like Laravel Sanctum work). Set to `'same-origin'` or
   * `'omit'` if your auth model needs it.
   */
  credentials?: RequestCredentials;
  /**
   * Name of the CSRF cookie. Default: `'XSRF-TOKEN'`.
   * Set to `null` to disable CSRF header forwarding.
   */
  csrfCookieName?: string | null;
  /**
   * Header name for the CSRF token. Default: `'X-XSRF-TOKEN'`.
   */
  csrfHeaderName?: string;
}

interface ServerSuggestion {
  id: string | number;
  title: string;
  details: string | null;
  type: SuggestionType;
  status: SuggestionStatus | null;
  author_id: string | number;
  author_name: string;
  vote_count: number;
  comment_count: number;
  created_at: string;
}

interface ServerComment {
  id: string | number;
  suggestion_id: string | number;
  author_id: string | number;
  author_name: string;
  body: string;
  created_at: string;
  is_admin_response?: boolean;
}

interface ServerVote {
  suggestion_id: string | number;
  user_id: string | number;
}

interface ErrorEnvelope {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

class HttpAdapterError extends Error {
  body: ErrorEnvelope | null;
  status: number;
  constructor(message: string, status: number, body: ErrorEnvelope | null) {
    super(message);
    this.name = 'HttpAdapterError';
    this.status = status;
    this.body = body;
  }
}

export function createHttpAdapter(config: HttpAdapterConfig): StorageAdapter {
  return new HttpAdapter(config);
}

class HttpAdapter implements StorageAdapter {
  private baseUrl: string;
  private resourcePath: string;
  private fetchImpl: typeof fetch;
  private credentials: RequestCredentials;
  private csrfCookieName: string | null;
  private csrfHeaderName: string;

  constructor(config: HttpAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.resourcePath = config.resourcePath ?? '/api/feature-suggestions';
    if (!this.resourcePath.startsWith('/')) {
      this.resourcePath = '/' + this.resourcePath;
    }
    this.resourcePath = this.resourcePath.replace(/\/+$/, '');
    this.fetchImpl =
      config.fetch ??
      config.fetchImpl ??
      ((...args) => globalThis.fetch(...args));
    this.credentials = config.credentials ?? 'include';
    this.csrfCookieName =
      config.csrfCookieName === undefined
        ? 'XSRF-TOKEN'
        : config.csrfCookieName;
    this.csrfHeaderName = config.csrfHeaderName ?? 'X-XSRF-TOKEN';
  }

  // ────────────────────────────────────────────────────────────────────────
  // StorageAdapter implementation
  // ────────────────────────────────────────────────────────────────────────

  async getSuggestions(): Promise<Suggestion[]> {
    const data = await this.request<ServerSuggestion[]>('GET', '');
    return (data ?? []).map(toSuggestion);
  }

  async createSuggestion(input: CreateSuggestionInput): Promise<Suggestion> {
    const body = {
      title: input.title,
      details: input.details ?? null,
      type: input.type,
    };
    const data = await this.request<ServerSuggestion>('POST', '', body);
    return toSuggestion(data);
  }

  async setStatus(
    suggestionId: string,
    status: SuggestionStatus,
  ): Promise<void> {
    await this.request<unknown>(
      'PATCH',
      `/${encodeURIComponent(suggestionId)}/status`,
      { status },
    );
  }

  async getVote(suggestionId: string, _userId: string): Promise<Vote | null> {
    void _userId;
    try {
      const data = await this.request<ServerVote>(
        'GET',
        `/${encodeURIComponent(suggestionId)}/vote`,
      );
      return {
        suggestionId: String(data.suggestion_id),
        userId: String(data.user_id),
      };
    } catch (err) {
      if (err instanceof HttpAdapterError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async addVote(suggestionId: string, _userId: string): Promise<void> {
    void _userId;
    await this.request<unknown>(
      'POST',
      `/${encodeURIComponent(suggestionId)}/vote`,
    );
  }

  async removeVote(suggestionId: string, _userId: string): Promise<void> {
    void _userId;
    await this.request<unknown>(
      'DELETE',
      `/${encodeURIComponent(suggestionId)}/vote`,
    );
  }

  async getComments(suggestionId: string): Promise<Comment[]> {
    const data = await this.request<ServerComment[]>(
      'GET',
      `/${encodeURIComponent(suggestionId)}/comments`,
    );
    return (data ?? []).map(toComment);
  }

  async addComment(
    suggestionId: string,
    input: CreateCommentInput,
  ): Promise<Comment> {
    const data = await this.request<ServerComment>(
      'POST',
      `/${encodeURIComponent(suggestionId)}/comments`,
      { body: input.body },
    );
    return toComment(data);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${this.resourcePath}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const isMutating = method !== 'GET' && method !== 'HEAD';
    if (isMutating) {
      const csrf = this.readCsrfToken();
      if (csrf !== null) {
        headers[this.csrfHeaderName] = csrf;
      }
    }

    let serializedBody: string | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: this.credentials,
    };
    if (serializedBody !== undefined) {
      init.body = serializedBody;
    }

    const res = await this.fetchImpl(url, init);

    if (res.status === 204) {
      return undefined as T;
    }

    let parsed: unknown = null;
    const text = await res.text();
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const envelope =
        parsed && typeof parsed === 'object' ? (parsed as ErrorEnvelope) : null;
      const message = envelope?.message ?? `HTTP ${res.status}`;
      throw new HttpAdapterError(message, res.status, envelope);
    }

    return parsed as T;
  }

  private readCsrfToken(): string | null {
    if (this.csrfCookieName === null) return null;
    if (typeof document === 'undefined' || !document.cookie) return null;
    const target = this.csrfCookieName + '=';
    for (const part of document.cookie.split(';')) {
      const trimmed = part.trim();
      if (trimmed.startsWith(target)) {
        const raw = trimmed.slice(target.length);
        try {
          return decodeURIComponent(raw);
        } catch {
          return raw;
        }
      }
    }
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────────

function toSuggestion(s: ServerSuggestion): Suggestion {
  const out: Suggestion = {
    id: String(s.id),
    title: s.title,
    type: s.type,
    authorId: String(s.author_id),
    authorName: s.author_name,
    voteCount: s.vote_count ?? 0,
    commentCount: s.comment_count ?? 0,
    createdAt: parseDate(s.created_at),
  };
  if (s.details != null) out.details = s.details;
  if (s.status != null) out.status = s.status;
  return out;
}

function toComment(c: ServerComment): Comment {
  return {
    id: String(c.id),
    suggestionId: String(c.suggestion_id),
    authorId: String(c.author_id),
    authorName: c.author_name,
    body: c.body,
    createdAt: parseDate(c.created_at),
    ...(c.is_admin_response !== undefined && {
      is_admin_response: c.is_admin_response,
    }),
  };
}

function parseDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}
