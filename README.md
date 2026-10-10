# Can You Remember?

Next.js frontend and Bun/Hono API backed by PostgreSQL.

## Structure

- `frontend/` — Next.js app, game UI, and public sound assets
- `backend/` — Hono API, PostgreSQL schema, migration, and server

## Local setup

Requires Node.js, Bun, and a PostgreSQL database (Neon works). From the repository root:

```sh
npm install --prefix frontend
npm install --prefix backend
cp backend/.env.example backend/.env
(cd backend && bun run migrate.ts)
```

Set `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string. Run these in separate terminals:

```sh
(cd backend && bun --watch index.ts)
npm run dev --prefix frontend
```

Open `http://localhost:3000`. Next.js proxies `/api/*` to `http://localhost:3001` in development and to `https://can-you-remember.onrender.com` in production. Override with `API_ORIGIN` in `frontend/.env.local` if needed. For a production deployment, serve both apps over HTTPS and set `DATABASE_URL` and `NODE_ENV=production` for the backend.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health response |
| GET | `/api/me` | Current player or `null` |
| POST | `/api/auth/signup` | `{ name, password }` (min. 8-character password) |
| POST | `/api/auth/login` | `{ name, password }` |
| POST | `/api/auth/guest` | Create a guest player |
| POST | `/api/auth/logout` | Revoke the current session |
| GET | `/api/leaderboard` | Top 100 best scores per player and game; `?game=Tile` or `?game=Number`, `?period=all` or `?period=weekly` (current UTC week) |
| POST | `/api/scores` | Authenticated `{ game, score, level }` |

Sessions use an HTTP-only, SameSite cookie; only a hash of each token is stored. Passwords are hashed with Bun's password API. Scores are submitted by the client on completed levels, so the leaderboard is intended for casual play rather than cheat-resistant competition.

## Checks

```sh
npm run lint --prefix frontend
npm run build --prefix frontend
npm run check --prefix backend
```
