CREATE TABLE IF NOT EXISTS nonsul_notebooks (
  user_id text PRIMARY KEY,
  revision integer NOT NULL CHECK (revision > 0),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

