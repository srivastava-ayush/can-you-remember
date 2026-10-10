CREATE TABLE IF NOT EXISTS players (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  password_hash TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT player_name_length CHECK (char_length(name) BETWEEN 2 AND 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS players_name_unique ON players (lower(name));

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_player_id_idx ON sessions (player_id);

CREATE TABLE IF NOT EXISTS scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game VARCHAR(6) NOT NULL CHECK (game IN ('Tile', 'Number')),
  score INTEGER NOT NULL CHECK (score >= 0),
  level INTEGER NOT NULL CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_rank_idx ON scores (score DESC, level DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS scores_player_game_idx ON scores (player_id, game);
