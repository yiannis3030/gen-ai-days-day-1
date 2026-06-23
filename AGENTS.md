# AGENTS.md

## Purpose

Authoritative engineering guidelines for this repository. Keep output modern, skimmable, and aligned with the documented stack.

## Stack

- Node.js
- TypeScript with strict mode enabled
- NestJS with controller / service / repository layering
- TypeORM with in-memory SQLite
- `class-validator` + `class-transformer` for DTO validation
- Jest for unit tests
- Supertest for integration / e2e tests
- React + Vite for the front-end

## Architecture Rules

- Use one NestJS module per feature.
- Keep each feature folder cohesive: controller, service, repository, entity, and DTOs live together.
- Controllers stay thin and only coordinate request / response flow.
- Business logic belongs in services.
- Persistence concerns belong in repositories.

## TypeScript Rules

- TypeScript strict mode must remain enabled.
- Do not use `any` unless there is an explicit, documented justification.
- Prefer precise types, narrow unions, and explicit return types on public APIs.

## DTO Rules

- DTO properties should be `readonly`.
- Validate DTOs with `class-validator` decorators such as `@IsString()`, `@IsNotEmpty()`, and related constraint decorators.
- Use `class-transformer` where request transformation is needed.

## Persistence Rules

- Database models must be TypeORM entities.
- Use `@Entity`, `@Column`, and `@PrimaryGeneratedColumn` decorators as appropriate.
- Do not model persisted database records as plain TypeScript interfaces.

## Error Handling

- Use NestJS exception filters with `@Catch` for centralized error handling.
- Prefer built-in `HttpException` subclasses over ad hoc error responses.

## Testing Requirements

- Every feature must include Jest unit tests.
- Unit coverage must include the service and controller, with dependencies mocked.
- Every feature must also include a Supertest integration test against the running NestJS app.

## Naming Conventions

- PascalCase for classes and decorators
- camelCase for variables and methods
- kebab-case for file names

## Quality Gates

- ESLint and Prettier are enforced.
- Do not commit code with lint errors.
