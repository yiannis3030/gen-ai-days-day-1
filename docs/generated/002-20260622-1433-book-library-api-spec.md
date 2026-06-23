scafffolding folowing the instructions from  # Book Library API — Technical Specification

Artifact base: 002-20260622-1433-book-library-api

## API Overview

The Book Library API is a RESTful service for managing a catalog of books and
their authors. It exposes CRUD operations for books, read/create operations for
authors, and relationship lookups (books by author). The contract is defined in
`openapi.yaml` (OpenAPI 3.0.0).

- Base URL: `http://localhost:8080/api`
- Content type: `application/json`
- Resource domains: `Books`, `Authors`

This spec maps the OpenAPI contract to a NestJS implementation using the layered
architecture (controller / service / repository / entity / DTO) defined in
`AGENTS.md`.

> Note: A pending change request (CR-001) replaces the single `author` string
> with a multi-author model. This spec documents the **current** contract as the
> baseline. The CR-001 impact is summarized in the Business Rules and
> Assumptions sections so the implementation can be designed to accommodate it.

## Endpoint Matrix

| Method | Path | Path/Query Params | Request Body | Success | Error(s) |
| ------ | ---- | ----------------- | ------------ | ------- | -------- |
| GET | `/books` | query: `genre?: string`, `author?: string` | — | `200` `Book[]` | — |
| POST | `/books` | — | `BookRequest` | `201` `Book` | `400`, `409` |
| GET | `/books/{id}` | path: `id: int64` | — | `200` `Book` | `404` |
| PUT | `/books/{id}` | path: `id: int64` | `BookRequest` | `200` `Book` | `400`, `404` |
| DELETE | `/books/{id}` | path: `id: int64` | — | `204` (no body) | `404` |
| GET | `/authors` | — | — | `200` `Author[]` | — |
| POST | `/authors` | — | `AuthorRequest` | `201` `Author` | `400` |
| GET | `/authors/{id}` | path: `id: int64` | — | `200` `Author` | `404` |
| GET | `/authors/{id}/books` | path: `id: int64` | — | `200` `Book[]` | `404` |

## Schema Summary

### Book (response model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `number` (int64) | Generated primary key |
| `title` | `string` | |
| `author` | `string` | Single author name (baseline; see CR-001) |
| `isbn` | `string` | |
| `publishedYear` | `number` | |
| `genre` | `string` | Optional |

NestJS mapping:
- TypeORM entity `BookEntity` (`@Entity('books')`).
- Returned to clients via a response shape / serialization of the entity.

```ts
// book.entity.ts
@Entity('books')
export class BookEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ type: 'varchar', unique: true })
  isbn!: string;

  @Column({ type: 'integer' })
  publishedYear!: number;

  @Column({ type: 'varchar', nullable: true })
  genre?: string;
}
```

### BookRequest (create/update DTO)

Required: `title`, `author`, `isbn`, `publishedYear`.

NestJS mapping: `CreateBookDto` (reused or extended for update as
`UpdateBookDto`).

```ts
// create-book.dto.ts
export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly author!: string;

  @IsString()
  @IsNotEmpty()
  readonly isbn!: string;

  @IsInt()
  readonly publishedYear!: number;

  @IsOptional()
  @IsString()
  readonly genre?: string;
}
```

### Author (response model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `number` (int64) | Generated primary key |
| `name` | `string` | |
| `nationality` | `string` | Optional |
| `birthYear` | `number` | Optional |
| `books` | `Book[]` | Related books |

NestJS mapping: TypeORM entity `AuthorEntity` (`@Entity('authors')`).

```ts
// author.entity.ts
@Entity('authors')
export class AuthorEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string;

  @Column({ type: 'integer', nullable: true })
  birthYear?: number;

  // Relationship modeling: see Assumptions for the books association.
}
```

### AuthorRequest (create DTO)

Required: `name`.

```ts
// create-author.dto.ts
export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly nationality?: string;

  @IsOptional()
  @IsInt()
  readonly birthYear?: number;
}
```

### ErrorResponse

| Field | Type |
| ----- | ---- |
| `error` | `string` |
| `message` | `string` |
| `status` | `number` |

NestJS mapping: produced by a global exception filter (`@Catch()`) that
normalizes thrown `HttpException`s into this shape. Plain type / interface is
acceptable here since it is not persisted.

## Validation Rules

| Schema.Field | Constraint | class-validator decorator |
| ------------ | ---------- | ------------------------- |
| `BookRequest.title` | required, string, max 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| `BookRequest.author` | required, string, max 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| `BookRequest.isbn` | required, string | `@IsString()` `@IsNotEmpty()` |
| `BookRequest.publishedYear` | required, integer | `@IsInt()` |
| `BookRequest.genre` | optional, string | `@IsOptional()` `@IsString()` |
| `AuthorRequest.name` | required, string, max 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| `AuthorRequest.nationality` | optional, string, max 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` |
| `AuthorRequest.birthYear` | optional, integer | `@IsOptional()` `@IsInt()` |

Enable a global `ValidationPipe` with `whitelist: true` and
`forbidNonWhitelisted: true` so unknown properties are rejected.

## Error Handling

| Status | Trigger | Exception |
| ------ | ------- | --------- |
| `400` | DTO validation failure / malformed body | `BadRequestException` (via `ValidationPipe`) |
| `404` | Book or author id not found | `NotFoundException` |
| `409` | Duplicate ISBN on create | `ConflictException` |
| `204` | Successful delete | (no body) |

- Centralize formatting with a global `@Catch()` exception filter that maps
  `HttpException` to the `ErrorResponse` schema (`error`, `message`, `status`).
- Prefer built-in `HttpException` subclasses over ad hoc responses.

## Business Rules

1. **Unique ISBN**: Creating a book with an ISBN that already exists must return
   `409 Conflict`. Update should not collide with another book's ISBN.
2. **Book filtering**: `GET /books` supports optional `genre` and `author`
   query filters. When both are present they are combined (AND).
3. **Author books lookup**: `GET /authors/{id}/books` returns all books linked to
   the author; a missing author id returns `404`.
4. **Update semantics**: `PUT /books/{id}` replaces the mutable fields of an
   existing book. A missing id returns `404`.
5. **Delete semantics**: `DELETE /books/{id}` returns `204` with no body on
   success, `404` when the id does not exist.

## Testing Requirements

Per `AGENTS.md`, each feature ships with unit and integration coverage.

- **Books unit tests (Jest, mocked deps)**
  - Service: create (success + duplicate ISBN), find all (with/without filters),
    find by id (found + not found), update (found + not found), delete (found +
    not found).
  - Controller: each route delegates to the service and returns the mapped
    status code.
- **Authors unit tests (Jest, mocked deps)**
  - Service: create, find all, find by id (found + not found), books-by-author
    (found + not found).
  - Controller: route delegation and status codes.
- **Integration tests (Supertest, running app)**
  - Full book lifecycle: create → get → list/filter → update → delete.
  - Duplicate ISBN returns `409`.
  - Validation failure returns `400`.
  - Author create → get → books lookup, including `404` paths.

## Assumptions

1. **Author–Book relationship**: The OpenAPI `Book.author` is a plain string,
   while `Author.books` implies an association. Assumed baseline: the book stores
   the author name as a string, and `GET /authors/{id}/books` resolves books by
   matching author name. A relational `@ManyToMany`/`@ManyToOne` model is
   recommended and is required by CR-001.
2. **CR-001 forward compatibility**: A pending change request replaces the single
   `author` field with an `authors` collection (one or more authors per book).
   The entity and DTO design should be ready to migrate `author: string` to
   `authors: string[]` (or a related `AuthorEntity` join). Until CR-001 is
   accepted, this spec implements the single-`author` baseline.
3. **ID type**: `int64` in the contract maps to a generated integer primary key
   in the in-memory SQLite database.
4. **Optional fields**: `genre`, `nationality`, and `birthYear` are treated as
   optional/nullable since they are not listed as required in the contract.
5. **Pagination**: Not defined in the contract; list endpoints return full
   collections.
6. **Validation pipeline**: A global `ValidationPipe` with whitelist behavior is
   assumed for `400` responses.

