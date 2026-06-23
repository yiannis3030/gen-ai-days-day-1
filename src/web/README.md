# Book Library — Front-end

React + Vite + TypeScript + Tailwind CSS UI for the Book Library API.

## Features

- **Books**: list, filter by genre/author, create, edit, delete.
- **Authors**: list, create, and view each author's books.
- Loading, empty, and error states; API validation messages surfaced inline.

## Running

The UI talks to the NestJS API through a Vite dev proxy (`/api` →
`http://localhost:8080`), so no CORS configuration is required.

1. Start the API (from the repo root):

   ```powershell
   npm run start:dev
   ```

2. In a second terminal, start the front-end:

   ```powershell
   cd src/web
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

## Notes

- This package is self-contained (`src/web`) and is excluded from the NestJS
  TypeScript build via the root `tsconfig.json` / `tsconfig.build.json`.
- To change the API target, edit the `server.proxy` entry in `vite.config.ts`.

