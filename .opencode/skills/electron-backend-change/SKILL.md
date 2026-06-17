<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

---

name: electron-backend-change
description: Use when modifying files under src/ElectronBackend/, especially the database layer, API commands, or the IPC boundary. Covers the dual tsconfig setup, generated DB types, better-sqlite3 builds, and the API command pattern.

---

# Electron Backend Changes

The ElectronBackend has several architectural constraints that are easy to miss
and will cause typecheck failures, runtime crashes, or pre-commit hook
rejections.

## Two tsconfig projects

This repo has **two separate TypeScript compilation units**:

1. **Root `tsconfig.json`** — covers `src/Frontend/` and `src/shared/`, excludes
   `src/ElectronBackend/`
2. **`src/ElectronBackend/tsconfig.json`** — extends the root config but covers
   `src/ElectronBackend/` only, with `noEmit: false`

Both must typecheck. The `yarn typecheck` command runs both:

```bash
yarn db:generate && tsc -p ./ && tsc --noEmit -p src/ElectronBackend
```

If you change backend files, the pre-commit hook automatically runs
`yarn db:generate` then `tsc --noEmit -p src/ElectronBackend` on staged backend
files.

## Database layer and generated code

Database access uses [Kysely](https://kysely.dev/) with auto-generated types.
Never edit generated files by hand.

### Generated files (do not edit)

- `src/ElectronBackend/db/generated/databaseTypes.ts` — TypeScript types derived
  from the schema
- `src/ElectronBackend/db/generated/databaseDiagram.svg` — visual schema diagram

### When the DB schema changes

If you modify any table definition or migration in `src/ElectronBackend/db/`,
you **must** regenerate:

```bash
yarn db:generate
```

This runs `src/ElectronBackend/db/generate.ts` which calls `generateTypes.ts`
and `generateDiagram.ts`. The generated files must be committed alongside the
schema change.

### DB access pattern

All database queries (except bulk writes) should go through Kysely using
`getDb()` from `src/ElectronBackend/db/db.ts`. Do not import `better-sqlite3`
directly for query logic.

## Dual better-sqlite3 builds

This project uses `better-sqlite3` as a native Node.js addon, installed twice:

| Package name              | Compiled for | Used by                         |
| ------------------------- | ------------ | ------------------------------- |
| `better-sqlite3`          | Node.js      | Vitest unit tests, Node scripts |
| `better-sqlite3-electron` | Electron     | App at runtime                  |

Source code always imports from `better-sqlite3`. Vite aliases it to
`better-sqlite3-electron` when building the Electron main process (see
`vite.config.mts`).

### ABI mismatch errors

The two packages share the same `node_modules/better-sqlite3/` directory for
their compiled binary. After `yarn install` or `yarn rebuild:electron`, the
binary may be compiled for Electron's V8 ABI instead of Node's, causing
`ERR_DLOPEN_FAILED` when Node tries to load it.

**`yarn db:generate` auto-heals this** — it probes the binary and rebuilds it
for Node if the ABI is wrong. The pre-commit hook and `yarn typecheck` both run
`db:generate`, so they self-repair automatically.

If you see ABI errors **outside** of `db:generate` (e.g. Vitest fails), fix
manually:

```bash
npm rebuild better-sqlite3 # rebuild for Node (fixes Vitest, db:generate)
```

If the **app** fails to start with an ABI error (Electron variant is wrong):

```bash
yarn rebuild:electron # rebuild for Electron runtime
```

Note: these two commands are mutually exclusive — each one overwrites the
binary in `node_modules/better-sqlite3/build/`. After running
`yarn rebuild:electron`, you may need to run `npm rebuild better-sqlite3`
before the next commit to restore the Node variant.

## API command pattern

Backend API commands are the bridge between frontend and backend. The pattern:

1. Define commands in `src/ElectronBackend/api/commands.ts`
2. Queries (read) go in `src/ElectronBackend/api/queries.ts`
3. Mutations (write) go in `src/ElectronBackend/api/mutations.ts`
4. Frontend accesses them via `backendClient` from
   `src/Frontend/util/backendClient.ts`

Queries are cached via Tanstack Query. Mutations return a list of query names to
invalidate, so the frontend stays up to date transparently.

### Adding a new API command

1. Add the command handler in the backend (`queries.ts` or `mutations.ts`)
2. Register it in `commands.ts`
3. For mutations, return the list of query keys that should be invalidated
4. The frontend can then call it through `backendClient` with full type safety

## IPC channels

Shared IPC channel names live in `src/shared/ipc-channels.ts`. If you add a new
channel, define it there so both frontend and backend reference the same string.

## Electron process structure

Three Electron entry points built by `vite-plugin-electron`:

- `src/ElectronBackend/preload.ts` — preload script (sandboxed bridge)
- `src/ElectronBackend/app.ts` — main process
- `src/ElectronBackend/dbProcess/dbProcess.ts` — dedicated DB worker process

Each gets its own Vite config from `getElectronProcessViteConfig()` in
`vite.config.mts`. They are only included in the build when mode is not `test`
or `e2e`.

## Common failures

- Editing `databaseTypes.ts` by hand → overwritten on next `db:generate`,
  typecheck breaks
- Forgetting to run `db:generate` after a schema change → `yarn typecheck` fails
- Importing `better-sqlite3-electron` directly in source → breaks Vitest;
  always import `better-sqlite3`
- ABI mismatch in `better-sqlite3` → `yarn db:generate` auto-rebuilds for Node;
  if Vitest fails, run `npm rebuild better-sqlite3` manually
- Adding an IPC channel string inline instead of in
  `src/shared/ipc-channels.ts` → divergent channel names cause silent failures
