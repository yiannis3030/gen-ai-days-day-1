# CR-001 — Multiple Authors per Book

Artifact base: 003-20260622-1545-cr-book-multiple-authors

## API Overview

**Change request**: Replace the single `author: string` field on `Book` and
`BookRequest` with an `authors: string[]` array that holds one or more author
names. A book must have at least one author.

This is a **breaking change** to the `Book` and `BookRequest` schemas and to
every layer that consumes them (entity, DTO, repository, service, controller,
front-end types, and UI components). The `openapi.yaml` contract has been
updated to reflect the new shapes; this spec documents the full implementation
impact.

- Base URL: `http://localhost:8080/api`
- Affected resource domains: `Books` (primary), `Authors` (secondary — name
  resolution for `GET /authors/{id}/books` must account for the new array
  column).

---

## Endpoint Matrix

Changes are limited to the `books` endpoints. Author endpoints are unaffected
structurally but their book-lookup logic must handle the new column type.

| Method | Path | Change |
| ------ | ---- | ------ |
| GET | `/books` | `?author` filter now performs a **substring match** across all elements of the `authors` array |
| POST | `/books` | Request body field renamed `author` → `authors` (array, minItems 1) |
| GET | `/books/{id}` | Response `Book` object returns `authors: string[]` instead of `author: string` |
| PUT | `/books/{id}` | Request body field renamed `author` → `authors` (array, minItems 1) |
| DELETE | `/books/{id}` | No change |
| GET | `/authors/{id}/books` | Response items return `authors: string[]`; author-name lookup logic changes (see Business Rules) |

Full endpoint matrix (unchanged from baseline spec `002`) with updated request /
response shapes:

| Method | Path | Query Params | Request Body | Success | Errors |
| ------ | ---- | ------------ | ------------ | ------- | ------ |
| GET | `/books` | `genre?: string`, `author?: string` | — | `200 Book[]` | — |
| POST | `/books` | — | `BookRequest` | `201 Book` | `400`, `409` |
| GET | `/books/{id}` | — | — | `200 Book` | `404` |
| PUT | `/books/{id}` | — | `BookRequest` | `200 Book` | `400`, `404`, `409` |
| DELETE | `/books/{id}` | — | — | `204` | `404` |
| GET | `/authors/{id}/books` | — | — | `200 Book[]` | `404` |

---

## Schema Summary

### Book (response — changed)

| Field | Old Type | New Type | Notes |
| ----- | -------- | -------- | ----- |
| `id` | `number` | `number` | Unchanged |
| `title` | `string` | `string` | Unchanged |
| `author` | `string` | _(removed)_ | |
| `authors` | _(absent)_ | `string[]` | At least one name |
| `isbn` | `string` | `string` | Unchanged |
| `publishedYear` | `number` | `number` | Unchanged |
| `genre` | `string?` | `string?` | Unchanged |

#### `BookEntity` — required changes

- Remove `@Column({ type: 'varchar', length: 255 }) author: string`.
- Add `@Column({ type: 'simple-array' }) authors: string[]`.
- `simple-array` persists the array as a comma-separated string in a single
  SQLite `TEXT` column. No schema migration strategy is needed for the
  in-memory SQLite setup; the table is recreated on each application start.

### BookRequest (create / update DTO — changed)

| Field | Old | New | Validation |
| ----- | --- | --- | ---------- |
| `title` | `string` | `string` | unchanged |
| `author` | `string` (required) | _(removed)_ | |
| `authors` | _(absent)_ | `string[]` (required) | `@IsArray()` `@ArrayNotEmpty()` `@IsString({ each: true })` `@MaxLength(255, { each: true })` |
| `isbn` | `string` | `string` | unchanged |
| `publishedYear` | `number` | `number` | unchanged |
| `genre` | `string?` | `string?` | unchanged |

`UpdateBookDto` extends `CreateBookDto` with no additional changes required.

### Author, AuthorRequest, ErrorResponse

No schema changes. The `Author.books` array items are `Book` objects and will
reflect the new `authors` field automatically once `BookEntity` is updated.

---

## Validation Rules

| Schema.Field | Constraint | class-validator decorator(s) |
| ------------ | ---------- | ----------------------------- |
| `BookRequest.title` | required, string, max 255 | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| `BookRequest.authors` | required, non-empty array | `@IsArray()` `@ArrayNotEmpty()` |
| `BookRequest.authors[*]` | each element: string, max 255 | `@IsString({ each: true })` `@MaxLength(255, { each: true })` |
| `BookRequest.isbn` | required, string | `@IsString()` `@IsNotEmpty()` |
| `BookRequest.publishedYear` | required, integer | `@IsInt()` |
| `BookRequest.genre` | optional, string | `@IsOptional()` `@IsString()` |

All existing `AuthorRequest` validation rules are unchanged.

---

## Error Handling

No new error codes are introduced.

| Status | Trigger | Exception |
| ------ | ------- | --------- |
| `400` | `authors` field missing, empty array, or any element fails string/length validation | `BadRequestException` (via `ValidationPipe`) |
| `400` | Any other DTO validation failure | `BadRequestException` |
| `404` | Book or author id not found | `NotFoundException` |
| `409` | Duplicate ISBN on create or update | `ConflictException` |
| `204` | Successful delete | no body |

The global `@Catch(HttpException)` filter maps all exceptions to `ErrorResponse`
— no filter changes needed.

---

## Business Rules

1. **Minimum one author**: A `BookRequest` with an empty `authors` array or no
   `authors` field must be rejected with `400 Bad Request`.
2. **Author filter — substring match**: `GET /books?author=<term>` should return
   books where *any* element of the `authors` array contains `<term>` as a
   substring (case-sensitive, per SQLite `LIKE` behavior). This differs from the
   old exact-match on the single `author` column.
3. **Author–book name lookup** (`GET /authors/{id}/books`): The service resolves
   books for an author by matching the author entity's `name` field against the
   `authors` column. Because `simple-array` stores a comma-joined string, the
   repository must use a `LIKE '%<name>%'` query rather than an equality filter.
   Implementors should be aware that a name that is a substring of another name
   (e.g. `"King"` vs `"Stephen King"`) can produce false positives; this is
   accepted as a known limitation of the flat-string storage strategy.
4. **Unique ISBN constraint**: Unchanged — enforced at the service layer before
   persistence.
5. **Update semantics**: `PUT /books/{id}` replaces `authors` in full; partial
   updates (PATCH) are out of scope.

---

## Impacted Implementation Files

| Layer | File | Required Change |
| ----- | ---- | --------------- |
| Entity | `src/books/book.entity.ts` | Replace `author: string` / `@Column varchar` with `authors: string[]` / `@Column simple-array` |
| DTO | `src/books/dto/create-book.dto.ts` | Replace `author` field with `authors: string[]`; add array validators |
| DTO | `src/books/dto/update-book.dto.ts` | No change (inherits from `CreateBookDto`) |
| Repository | `src/books/books.repository.ts` | `findAll`: replace equality `where.author` with `QueryBuilder LIKE`; `findByAuthor`: replace `find({ where: { author } })` with `QueryBuilder LIKE` |
| Service | `src/books/books.service.ts` | Replace `book.author = dto.author` with `book.authors = dto.authors` |
| Controller | `src/books/books.controller.ts` | No change — delegates to service |
| Front-end types | `src/web/src/types.ts` | `Book.author: string` → `Book.authors: string[]`; same for `BookRequest` |
| Front-end form | `src/web/src/components/BookForm.tsx` | Replace single text input with dynamic multi-author list (add / remove rows) |
| Front-end view | `src/web/src/components/BooksView.tsx` | Render `book.authors.join(', ')` in the Author table column |
| Unit tests | `src/books/books.service.spec.ts` | Update `BookEntity` fixture: `author → authors: ['...']`; update `CreateBookDto` fixture |
| Unit tests | `src/books/books.controller.spec.ts` | Update `BookEntity` stub: `author → authors: ['...']` |
| E2E tests | `test/app.e2e-spec.ts` | Update all `bookPayload` objects to use `authors: [...]`; update inline `send()` calls |

---

## Assumptions

1. **Storage strategy**: `simple-array` (TypeORM built-in) is chosen for
   simplicity with the in-memory SQLite setup. It serializes `string[]` as a
   comma-separated `TEXT` column. Author names must not contain commas; if they
   do, a JSON column or a separate join table should be used instead.
2. **Case sensitivity**: SQLite `LIKE` is case-insensitive for ASCII characters;
   the `?author` filter therefore performs a case-insensitive substring match in
   practice, even though the contract does not specify case behavior.
3. **No migration**: The database is in-memory (`better-sqlite3`); the schema is
   dropped and recreated on each start (`synchronize: true`). No migration script
   is required.
4. **`simple-array` and commas**: TypeORM `simple-array` uses `,` as the
   separator. If a stored author name contained a comma (e.g. `"Smith, John"`),
   TypeORM would split it incorrectly on read. Names with commas are therefore
   unsupported under this storage strategy.
5. **Author entity vs. book authors array**: The `Author` entity and the
   `BookEntity.authors` array remain decoupled string fields — there is no
   foreign key or join table between them. Referential integrity is not enforced
   by the database.
6. **Ordering**: The order of elements in `authors` is preserved by
   `simple-array` serialization and must be treated as significant by clients.

