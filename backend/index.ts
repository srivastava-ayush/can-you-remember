import { createHash, randomBytes } from "node:crypto";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { db } from "./db";

const app = new Hono();
const COOKIE = "cyr_session";
const SESSION_DAYS = 30;

type Player = { id: string; name: string; is_guest: boolean };
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function currentPlayer(token?: string): Promise<Player | null> {
  if (!token) return null;
  const rows = await db<Player[]>`
    SELECT p.id::text, p.name, p.is_guest
    FROM sessions s JOIN players p ON p.id = s.player_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `;
  return rows[0] ?? null;
}

async function issueSession(player: Player) {
  const token = randomBytes(32).toString("hex");
  await db`INSERT INTO sessions (token_hash, player_id, expires_at)
    VALUES (${hashToken(token)}, ${player.id}, now() + interval '30 days')`;
  return token;
}

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

async function credentials(c: { req: { json: () => Promise<unknown> } }) {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return null;
  const { name, password } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof password !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 32 || password.length < 8 || password.length > 128) return null;
  return { name: trimmed, password };
}

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Server error" }, 500);
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/me", async (c) => {
  const player = await currentPlayer(getCookie(c, COOKIE));
  return c.json({ player: player && { id: player.id, name: player.name, isGuest: player.is_guest } });
});

app.post("/api/auth/signup", async (c) => {
  const input = await credentials(c);
  if (!input) return c.json({ error: "Use a 2–32 character name and an 8–128 character password." }, 400);
  const passwordHash = await Bun.password.hash(input.password);
  const rows = await db<Player[]>`
    INSERT INTO players (name, password_hash) VALUES (${input.name}, ${passwordHash})
    ON CONFLICT DO NOTHING RETURNING id::text, name, is_guest
  `;
  const player = rows[0];
  if (!player) return c.json({ error: "That name is already taken." }, 409);
  setSessionCookie(c, await issueSession(player));
  return c.json({ player: { id: player.id, name: player.name, isGuest: false } }, 201);
});

app.post("/api/auth/login", async (c) => {
  const input = await credentials(c);
  if (!input) return c.json({ error: "Invalid name or password." }, 400);
  const rows = await db<(Player & { password_hash: string })[]>`
    SELECT id::text, name, is_guest, password_hash FROM players
    WHERE lower(name) = lower(${input.name}) AND is_guest = false
  `;
  const player = rows[0];
  if (!player || !(await Bun.password.verify(input.password, player.password_hash))) {
    return c.json({ error: "Invalid name or password." }, 401);
  }
  setSessionCookie(c, await issueSession(player));
  return c.json({ player: { id: player.id, name: player.name, isGuest: false } });
});

app.post("/api/auth/guest", async (c) => {
  const name = `Guest-${randomBytes(5).toString("hex")}`;
  const rows = await db<Player[]>`
    INSERT INTO players (name, is_guest) VALUES (${name}, true)
    RETURNING id::text, name, is_guest
  `;
  const player = rows[0];
  setSessionCookie(c, await issueSession(player));
  return c.json({ player: { id: player.id, name: player.name, isGuest: true } }, 201);
});

app.post("/api/auth/logout", async (c) => {
  const token = getCookie(c, COOKIE);
  if (token) await db`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/leaderboard", async (c) => {
  const game = c.req.query("game");
  if (game && game !== "Tile" && game !== "Number") return c.json({ error: "Invalid game." }, 400);
  const rows = await db<{
    id: string; name: string; game: "Tile" | "Number"; score: number; level: number; date: string;
  }[]>`
    SELECT id, name, game, score, level, date FROM (
      SELECT DISTINCT ON (s.player_id, s.game)
        s.id::text AS id, p.name, s.game, s.score, s.level,
        to_char(s.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
        s.created_at
      FROM scores s JOIN players p ON p.id = s.player_id
      WHERE ${game ? db`s.game = ${game}` : db`TRUE`}
      ORDER BY s.player_id, s.game, s.score DESC, s.level DESC, s.created_at ASC
    ) ranked
    ORDER BY score DESC, level DESC, created_at ASC LIMIT 100
  `;
  return c.json({ entries: rows });
});

app.post("/api/scores", async (c) => {
  const player = await currentPlayer(getCookie(c, COOKIE));
  if (!player) return c.json({ error: "Log in to save a score." }, 401);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid score." }, 400);
  const { game, score, level } = body as Record<string, unknown>;
  if ((game !== "Tile" && game !== "Number") || !Number.isSafeInteger(score) || !Number.isSafeInteger(level) ||
      (score as number) < 0 || (score as number) > 10_000_000 || (level as number) < 1 || (level as number) > 10_000) {
    return c.json({ error: "Invalid score." }, 400);
  }
  const rows = await db<{ id: string }[]>`
    INSERT INTO scores (player_id, game, score, level)
    SELECT ${player.id}, ${game}, ${score as number}, ${level as number}
    WHERE NOT EXISTS (
      SELECT 1 FROM scores
      WHERE player_id = ${player.id} AND game = ${game} AND score >= ${score as number}
    )
    RETURNING id::text
  `;
  return c.json({ saved: rows.length > 0, id: rows[0]?.id ?? null }, rows.length > 0 ? 201 : 200);
});

export default { port: Number(process.env.API_PORT || 3001), fetch: app.fetch };
