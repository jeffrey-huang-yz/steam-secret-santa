-- users
CREATE TABLE users (
  id           BIGSERIAL PRIMARY KEY,
  steam_id     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar       TEXT NOT NULL
);

-- events
CREATE TABLE events (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  budget_cents   INT  NOT NULL,
  signup_close   TIMESTAMPTZ NOT NULL,
  reveal_date    TIMESTAMPTZ NOT NULL,
  matches_run_at TIMESTAMPTZ
);

-- participants
CREATE TABLE participants (
  id         SERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   INT    NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  matched_to INT REFERENCES participants(id),
  gift_scheduled_at TIMESTAMPTZ
);

-- wish‑list
CREATE TABLE wishlist_items (
  id          SERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steam_app   INT    NOT NULL,
  title       TEXT   NOT NULL,
  price_cents INT,
  UNIQUE (user_id, steam_app)
);

CREATE UNIQUE INDEX uniq_participant ON participants(user_id, event_id);
