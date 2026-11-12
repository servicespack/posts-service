# AGENTS.md — Posts Service

## Environment

- **Node.js >= 24** required (see `package.json` `engines`)
- Package name: `@servicespack/posts-service`
- `"type": "module"` in `package.json` — use ESM `import/export` syntax

## Commands

| Action | Command |
|---|---|
| Build | `npm run build` (`tsdown src/index.ts`) |
| Start production | `npm start` (`node dist/index.mjs`) |
| Start dev server | `npm run start:dev` (`tsx watch src/index.ts`) |
| Run tests | `npm test` (`vitest run`) |
| Run tests with coverage | `npm run test:coverage` |
| Run mutation tests | `npm run test:mutation` (`stryker run`) |
| Lint | `npm run lint` (`eslint .`) |
| Lint fix | `npm run lint:fix` |

**No standalone typecheck script** — type checking happens during `npm run build` via tsdown.

**Command order for verification**: `lint` → `build` → `test` → `test:mutation` (mutation testing is slowest; run last).

## Architecture

Clean architecture layers:

```
src/
  domain/          Entities (Post, Bookmark), Repository interfaces, Adapters, Errors
  use-cases/       Business logic (create/list/get/update/delete post, reactions, bookmarks)
  infrastructure/
    http/          Controllers, Routes, Middleware (auth, rate-limit), OpenAPI spec
    database/      DB connection + 2 driver implementations (Mongoose or Lowdb)
    cache/         Redis cache service (optional, degrades gracefully)
    logging/       Pino logger
    adapters/      Notification adapter (DummyNotificationAdapter default)
  index.ts         App entry / composition root
```

**Key pattern**: Use cases depend on domain interfaces; infrastructure implements them. `src/index.ts` is the composition root that wires everything together.

## Database Driver Switching

Set `DATABASE_DRIVER` env var to switch:
- `DATABASE_DRIVER=mongodb` (default) — uses Mongoose + MongoDB
- `DATABASE_DRIVER=lowdb` — uses Lowdb (file-based, `LOWDB_FILE` defaults to `./data/db.json`)

Both drivers implement the same `PostRepository` and `BookmarkRepository` interfaces.

## Key Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Server port |
| `DATABASE_DRIVER` | `mongodb` | `mongodb` or `lowdb` |
| `MONGODB_URI` | `mongodb://localhost:27017/posts` | MongoDB connection |
| `LOWDB_FILE` | `./data/db.json` | Lowdb data file |
| `REDIS_URL` | `redis://localhost:6379` | Redis (optional) |
| `JWT_SECRET` | `secret` (dev only) | JWT signing key |
| `JWT_ISSUER` | `servicespack` | JWT issuer claim |
| `JWT_AUDIENCE` | `servicespack` | JWT audience claim |
| `MAX_THREAD_DEPTH` | `3` | Max reply depth for post threads |
| `LOG_LEVEL` | `info` | Pino log level |
| `NODE_ENV` | — | `production` enables JWT_SECRET requirement |

## Testing Notes

- **Runner**: Vitest (`vitest.config.mts`) — uses `forks` pool with `singleFork: true`, `isolate: false`, `fileParallelism: false` — all tests run **serially in one fork**
- **Integration tests** (in `tests/integration/`) use `mongodb-memory-server` — no external MongoDB needed
- **Unit/integration spec files**: `*.spec.ts` convention (co-located with source where applicable)
- **Stryker** (mutation testing): configured in `stryker.config.json`, mutates `src/**/*.ts` excluding `**/*.spec.ts`
- **Coverage** excludes `src/index.ts` (entry point) per vitest config

## Build Output

- Build tool: `tsdown` (not `tsc`)
- Output: `dist/index.mjs` (ESM entry point)
- Dockerfile: multi-stage build with `node:24-alpine`, exposes port 8080, runs as `node` user

## Soft Delete Pattern

All posts and bookmarks use soft deletes (`deletedAt` timestamp). Repository queries always filter `deletedAt: null` to exclude deleted records.

## OpenAPI

Auto-generated from Zod schemas via `@asteasolutions/zod-to-openapi`. Accessible at:
- `/docs` — Swagger UI
- `/openapi.json` — Raw spec
