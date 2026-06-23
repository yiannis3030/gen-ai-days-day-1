# OpenAPI ↔ Implementation Gap Analysis — Book Library API

Artifact base: 001-20250723-1200-openapi-impl-gap-analysis

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Endpoint Matrix](#2-endpoint-matrix)
3. [Schema Summary](#3-schema-summary)
4. [Validation Rules](#4-validation-rules)
5. [Error Handling](#5-error-handling)
6. [Business Rules](#6-business-rules)
7. [Discrepancy Catalogue](#7-discrepancy-catalogue)
8. [Required File Changes](#8-required-file-changes)
9. [Assumptions](#9-assumptions)

---

## 1. API Overview

The **Book Library API** (OpenAPI 3.0.0, version 1.0.0) exposes two resource collections — **Books** and **Authors** — under the base URL `http://localhost:8080/api`.

The NestJS application:
- Listens on port **8080** with global prefix **`/api`** (`main.ts`). ✅
- Uses **SQLite in-memory** via TypeORM with `synchronize: true` (`app.module.ts`).
- Registers a global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).
- Registers a global `HttpExceptionFilter` that formats all errors as `{ error, message, status }`.

Overall alignment is **good**. All nine endpoints from the spec are implemented. However several discrepancies exist — one **critical architectural gap** (D4), two **low-severity validation gaps** (D2, D3), and three **documentation / minor issues** (D1, D5, D6).

---

## 2. Endpoint Matrix

### 2.1 Books

| # | Method | Path | Spec | Impl | Notes |
|---|--------|------|------|------|-------|
| B1 | `GET` | `/api/books` | ✅ | ✅ | Query params: `genre`, `author` |
| B2 | `POST` | `/api/books` | ✅ | ✅ | 201, 400, 409 |
| B3 | `GET` | `/api/books/:id` | ✅ | ✅ | 200, 404 |
| B4 | `PUT` | `/api/books/:id` | ✅ | ✅ | 200, 400, 404, 409 |
| B5 | `DELETE` | `/api/books/:id` | ✅ | ✅ | 204, 404 |

### 2.2 Authors

| # | Method | Path | Spec | Impl | Notes |
|---|--------|------|------|------|-------|
| A1 | `GET` | `/api/authors` | ✅ | ✅ | Returns authors with embedded `books[]` |
| A2 | `POST` | `/api/authors` | ✅ | ✅ | 201, 400 |
| A3 | `GET` | `/api/authors/:id` | ✅ | ✅ | 200, 404 |
| A4 | `GET` | `/api/authors/:id/books` | ✅ | ✅ | 200, 404 |

No endpoints are missing or spurious relative to the spec.

---

## 3. Schema Summary

### 3.1 `Book` Response Schema vs `BookEntity`

| OpenAPI field | OAS type | `BookEntity` field | TypeORM decorator | Match? |
|---|---|---|---|---|
| `id` | integer (int64) | `id: number` | `@PrimaryGeneratedColumn({ type: 'integer' })` | ✅ |
| `title` | string | `title: string` | `@Column({ type: 'varchar', length: 255 })` | ✅ |
| `author` | string | `author: string` | `@Column({ type: 'varchar', length: 255 })` | ✅ |
| `isbn` | string | `isbn: string` | `@Column({ type: 'varchar', unique: true })` | ⚠️ D1 — no `length` |
| `publishedYear` | integer | `publishedYear: number` | `@Column({ type: 'integer' })` | ✅ |
| `genre` | string (optional) | `genre?: string` | `@Column({ type: 'varchar', nullable: true })` | ✅ |

### 3.2 `BookRequest` vs `CreateBookDto` / `UpdateBookDto`

| OpenAPI field | Required | maxLength | `CreateBookDto` class-validator | Match? |
|---|---|---|---|---|
| `title` | ✅ | 255 | `@IsString @IsNotEmpty @MaxLength(255)` | ✅ |
| `author` | ✅ | 255 | `@IsString @IsNotEmpty @MaxLength(255)` | ✅ |
| `isbn` | ✅ | — | `@IsString @IsNotEmpty` | ✅ |
| `publishedYear` | ✅ | — | `@IsInt` | ⚠️ D2 — no range |
| `genre` | ❌ | — | `@IsOptional @IsString` | ✅ |

`UpdateBookDto extends CreateBookDto` — all fields required, matching `PUT` full-replace semantics. ✅

### 3.3 `Author` Response Schema vs `AuthorEntity`

| OpenAPI field | OAS type | `AuthorEntity` field | TypeORM decorator | Match? |
|---|---|---|---|---|
| `id` | integer (int64) | `id: number` | `@PrimaryGeneratedColumn({ type: 'integer' })` | ✅ |
| `name` | string | `name: string` | `@Column({ type: 'varchar', length: 255 })` | ✅ |
| `nationality` | string (optional) | `nationality?: string` | `@Column({ type: 'varchar', length: 100, nullable: true })` | ✅ |
| `birthYear` | integer (optional) | `birthYear?: number` | `@Column({ type: 'integer', nullable: true })` | ✅ |
| `books` | `Book[]` | `books?: BookEntity[]` | **None — virtual field** | ⚠️ **D4 CRITICAL** |

### 3.4 `AuthorRequest` vs `CreateAuthorDto`

| OpenAPI field | Required | Constraints | `CreateAuthorDto` class-validator | Match? |
|---|---|---|---|---|
| `name` | ✅ | maxLength 255 | `@IsString @IsNotEmpty @MaxLength(255)` | ✅ |
| `nationality` | ❌ | maxLength 100 | `@IsOptional @IsString @MaxLength(100)` | ✅ |
| `birthYear` | ❌ | integer | `@IsOptional @IsInt` | ✅ |

### 3.5 `ErrorResponse` vs `HttpExceptionFilter`

| OpenAPI field | Type | Implementation | Match? |
|---|---|---|---|
| `error` | string | `HttpStatus[status] ?? 'Error'` (enum key, e.g. `"NOT_FOUND"`) | ✅ (⚠️ D5 — format note) |
| `message` | string | Resolved from exception or `'Internal server error'` | ✅ |
| `status` | integer | HTTP numeric status code | ✅ |

---

## 4. Validation Rules

### 4.1 `CreateBookDto` / `UpdateBookDto` — Full Decorator Inventory

| Field | Decorators Present | OpenAPI Constraint | Gap? |
|---|---|---|---|
| `title` | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | required, maxLength:255 | None |
| `author` | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | required, maxLength:255 | None |
| `isbn` | `@IsString()` `@IsNotEmpty()` | required, string | None (no format in spec) |
| `publishedYear` | `@IsInt()` | required, integer | **D2** — no `@Min`/`@Max` |
| `genre` | `@IsOptional()` `@IsString()` | optional, string | None |

### 4.2 `BookQueryDto`

| Field | Decorators | OpenAPI Param | Gap? |
|---|---|---|---|
| `genre` | `@IsOptional()` `@IsString()` | query optional | None |
| `author` | `@IsOptional()` `@IsString()` | query optional | None |

### 4.3 `CreateAuthorDto`

| Field | Decorators Present | OpenAPI Constraint | Gap? |
|---|---|---|---|
| `name` | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | required, maxLength:255 | None |
| `nationality` | `@IsOptional()` `@IsString()` `@MaxLength(100)` | optional, maxLength:100 | None |
| `birthYear` | `@IsOptional()` `@IsInt()` | optional, integer | None |

---

## 5. Error Handling

### 5.1 Per-Endpoint Coverage

| Endpoint | Spec Errors | Thrown By | HTTP Status | Covered? |
|---|---|---|---|---|
| `POST /books` | 400 | `ValidationPipe` | 400 | ✅ |
| `POST /books` | 409 | `ConflictException` | 409 | ✅ |
| `GET /books/:id` | 404 | `NotFoundException` | 404 | ✅ |
| `PUT /books/:id` | 400 | `ValidationPipe` | 400 | ✅ |
| `PUT /books/:id` | 404 | `NotFoundException` | 404 | ✅ |
| `PUT /books/:id` | 409 | `ConflictException` | 409 | ✅ |
| `DELETE /books/:id` | 404 | `NotFoundException` | 404 | ✅ |
| `POST /authors` | 400 | `ValidationPipe` | 400 | ✅ |
| `GET /authors/:id` | 404 | `NotFoundException` | 404 | ✅ |
| `GET /authors/:id/books` | 404 | `NotFoundException` | 404 | ✅ |
| All `/:id` routes | *undocumented* | `ParseIntPipe` | **400** | ⚠️ **D6** — not in spec |

### 5.2 `HttpExceptionFilter` Global Behaviour

- `@Catch()` with no type arg catches **all** exceptions (HTTP and non-HTTP).
- `HttpException` subtypes → HTTP status from the exception, message extracted from response body.
- Non-`HttpException` (runtime errors) → HTTP **500**, message: `'Internal server error'`, stack logged at ERROR level.
- `ValidationPipe` produces an `HttpException` with a `message: string[]`; the filter joins them with `', '`.
- All responses are shaped as `ErrorResponse { error, message, status }`. ✅

---

## 6. Business Rules

### 6.1 ISBN Uniqueness

- DB-level: `@Column({ unique: true })` on `BookEntity.isbn`. ✅
- Service-level (CREATE): `findByIsbn(dto.isbn)` before insert; throws `ConflictException` if exists. ✅
- Service-level (UPDATE): `findByIsbn(dto.isbn)` and allows same ISBN if `isbnOwner.id === id`. ✅

### 6.2 Author-Book Relationship — CRITICAL DESIGN GAP (D4)

**How it currently works:**
- `BookEntity` stores `author: string` — a denormalized author name, no FK to `authors` table.
- `AuthorEntity.books` is a plain TypeScript property with no `@OneToMany` decorator.
- `AuthorsService.findAll()` and `findOne()` manually populate `books` via `BooksRepository.findByAuthor(author.name)` — an exact-match `WHERE author = ?` query issued per author (N+1 pattern).
- `AuthorsService.findBooks(id)` similarly looks up books by author name after verifying the author exists.

**Risks introduced:**
1. **No referential integrity** — books can reference non-existent author names.
2. **N+1 queries** — `findAll()` executes one extra query per author.
3. **Case-sensitive name matching** — `BookEntity.author = 'Tolkien'` and `AuthorEntity.name = 'tolkien'` are treated as different authors.
4. **No cascade** — deleting/renaming an author leaves orphaned book records.

**Spec alignment note:** The OpenAPI `Book` schema field `author: string` (not `authorId`) implies denormalization is intentional. The `Author.books: Book[]` field in the response is functionally satisfied at runtime. This is not a spec *violation* but is an architectural fragility.

### 6.3 GET /books Filter Logic

Both `genre` and `author` filters use TypeORM `FindOptionsWhere` exact-match (`=`). The spec says "Filter by genre" / "Filter by author name" without specifying partial/fuzzy match semantics. Exact-match is the conservative default.

---

## 7. Discrepancy Catalogue

| ID | Severity | Category | File(s) | Description |
|---|---|---|---|---|
| **D1** | Low | Entity / DB | `book.entity.ts` | `isbn` column has no `length` option; defaults to unbounded varchar in SQLite. |
| **D2** | Low | Validation | `create-book.dto.ts` | `publishedYear` has `@IsInt()` but no `@Min` / `@Max`; accepts any integer including negatives. |
| **D3** | Low | Validation | `create-book.dto.ts` | `isbn` has no format validation (`@IsISBN()`); any non-empty string is accepted. |
| **D4** | **Critical** | Architecture | `author.entity.ts`, `authors.service.ts`, `books.repository.ts` | `AuthorEntity.books` is a virtual field with no TypeORM `@OneToMany`, no FK constraint, and manual N+1 hydration. |
| **D5** | Low | Error Format | `http-exception.filter.ts` | `error` field outputs TypeScript `HttpStatus` enum keys (e.g., `"NOT_FOUND"`) rather than HTTP reason phrases. Not a spec violation; note for API consumers. |
| **D6** | Low | Error Docs | `openapi.yaml` | All `/:id` routes are missing a `400` response for the case where `id` is a non-integer. `ParseIntPipe` will produce 400 in practice. |

---

## 8. Required File Changes

### D4 — Fix Author-Book Relationship (Critical)

#### Option A — Pure Denormalized (Accept Current Design, Fix N+1)

Accepts `author: string` as the design (matching OpenAPI). Improves queries only.

**`src/books/books.repository.ts`**
- Current `findByAuthor(author: string)` uses exact match — acceptable per A3.
- No query change needed; only the N+1 concern in `AuthorsService` remains.

**`src/authors/authors.service.ts`**
- `findAll()`: Replace per-author loop with a single `findAll()` call that groups by `author` name.
  - Or add a `findAllGroupedByAuthor()` on the books repository that returns `Map<string, BookEntity[]>`.

#### Option B — Add Proper TypeORM Relation (Recommended)

**`src/books/book.entity.ts`**
```
// Add:
import { ManyToOne } from 'typeorm';
import { AuthorEntity } from '../authors/author.entity';

@ManyToOne(() => AuthorEntity, (a) => a.books, { nullable: true, onDelete: 'SET NULL' })
authorEntity?: AuthorEntity;

@Column({ type: 'integer', nullable: true })
authorId?: number;
// Keep existing `author: string` for backward API compat
```

**`src/authors/author.entity.ts`**
```
// Change import, add decorator:
import { OneToMany } from 'typeorm';
import { BookEntity } from '../books/book.entity';

@OneToMany(() => BookEntity, (b) => b.authorEntity, { cascade: false, eager: false })
books?: BookEntity[];
// Remove virtual-field comment
```

**`src/authors/authors.service.ts`**
```
// Replace manual hydration in findAll() and findOne():
return this.authorsRepository.findAll({ relations: ['books'] });
// and:
return this.authorsRepository.findById(id, { relations: ['books'] });
```

**`src/authors/authors.repository.ts`**
```
// Update findAll() and findById() to accept optional FindManyOptions / FindOneOptions:
findAll(options?: FindManyOptions<AuthorEntity>): Promise<AuthorEntity[]> {
  return this.repository.find(options);
}
findById(id: number, options?: FindOneOptions<AuthorEntity>): Promise<AuthorEntity | null> {
  return this.repository.findOne({ where: { id }, ...options });
}
```

---

### D1 — Add `length` to `isbn` Column (Low)

**`src/books/book.entity.ts`**
```
// Change:
@Column({ type: 'varchar', unique: true })
// To:
@Column({ type: 'varchar', length: 20, unique: true })
```

---

### D2 — Add Range Validation to `publishedYear` (Low)

**`src/books/dto/create-book.dto.ts`**
```
// Add import:
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

// Change publishedYear field:
@IsInt()
@Min(1000)
@Max(new Date().getFullYear() + 1)
readonly publishedYear!: number;
```

---

### D6 — Document `400` for Non-Integer `:id` (Documentation Only)

**`openapi.yaml`** — Add to the shared `parameters` section of `/books/{id}` and `/authors/{id}`:
```yaml
'400':
  description: Invalid path parameter — id must be an integer
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/ErrorResponse'
```

No implementation code changes required.

---

## 9. Assumptions

| # | Statement |
|---|---|
| **A1** | `publishedYear` range is not constrained by the spec. D2 is a best-practice improvement, not a compliance defect. |
| **A2** | The denormalized `author: string` in `BookEntity` is intentional — the OpenAPI `Book` schema uses `author: string`, not `authorId`. D4 is an architectural risk, not a spec violation. |
| **A3** | `GET /books?author=` and `GET /books?genre=` perform **exact-match** filtering. The spec does not specify match semantics. |
| **A4** | `isbn` is treated as an opaque string. The spec has no `format: isbn` annotation, so `@IsISBN()` is optional (D3). |
| **A5** | The global `HttpExceptionFilter` catching non-HTTP exceptions (500) is correct default behavior not documented in the spec. |
| **A6** | No `PUT /authors/:id` or `DELETE /authors/:id` endpoints are missing — the spec intentionally excludes them. |
| **A7** | `ValidationPipe` with `forbidNonWhitelisted: true` rejecting extra request body fields is stricter than required by the spec but is correct. |
| **A8** | `NNN = 001` — no prior spec files were found under `docs/generated/`. |

