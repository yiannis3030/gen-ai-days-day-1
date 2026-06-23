export interface Book {
  readonly id: number;
  readonly title: string;
  readonly authors: string[];
  readonly isbn: string;
  readonly publishedYear: number;
  readonly genre?: string;
}

export interface BookRequest {
  readonly title: string;
  readonly authors: string[];
  readonly isbn: string;
  readonly publishedYear: number;
  readonly genre?: string;
}

export interface Author {
  readonly id: number;
  readonly name: string;
  readonly nationality?: string;
  readonly birthYear?: number;
  readonly books?: Book[];
}

export interface AuthorRequest {
  readonly name: string;
  readonly nationality?: string;
  readonly birthYear?: number;
}

export interface ErrorResponse {
  readonly error?: string;
  readonly message?: string | string[];
  readonly status?: number;
}

