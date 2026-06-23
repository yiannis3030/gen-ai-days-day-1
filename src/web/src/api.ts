import type {
  Author,
  AuthorRequest,
  Book,
  BookRequest,
  ErrorResponse,
} from './types';

const BASE_URL = '/api';

/** Error thrown for any non-2xx API response, carrying a readable message. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractMessage(body: ErrorResponse | null, fallback: string): string {
  if (!body) {
    return fallback;
  }
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  return body.message ?? body.error ?? fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('Network error: is the API running on port 8080?', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(
      extractMessage(body as ErrorResponse | null, response.statusText),
      response.status,
    );
  }

  return body as T;
}

export const booksApi = {
  list: (params?: { genre?: string; author?: string }): Promise<Book[]> => {
    const query = new URLSearchParams();
    if (params?.genre) query.set('genre', params.genre);
    if (params?.author) query.set('author', params.author);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<Book[]>(`/books${suffix}`);
  },
  get: (id: number): Promise<Book> => request<Book>(`/books/${id}`),
  create: (payload: BookRequest): Promise<Book> =>
    request<Book>('/books', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: BookRequest): Promise<Book> =>
    request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: number): Promise<void> =>
    request<void>(`/books/${id}`, { method: 'DELETE' }),
};

export const authorsApi = {
  list: (): Promise<Author[]> => request<Author[]>('/authors'),
  get: (id: number): Promise<Author> => request<Author>(`/authors/${id}`),
  books: (id: number): Promise<Book[]> => request<Book[]>(`/authors/${id}/books`),
  create: (payload: AuthorRequest): Promise<Author> =>
    request<Author>('/authors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

