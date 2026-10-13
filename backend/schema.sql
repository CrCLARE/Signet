 -- ============================================================
-- Signet - D1 database schema
-- Run this once against a fresh database.
-- All statements are idempotent (CREATE ... IF NOT EXISTS).
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  nickname      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------
-- orders
--
-- One row per paid order. `provider` identifies which adapter
-- produced it (e.g. "afdian", "stripe", "manual").
-- `(provider, order_no)` is unique because the same order number
-- could theoretically be issued by different platforms.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  order_no      TEXT NOT NULL,
  provider      TEXT NOT NULL,
  provider_user TEXT,
  provider_raw  TEXT,
  amount        TEXT NOT NULL,
  status        INTEGER NOT NULL,
  bound_user_id TEXT,
  bound_at      INTEGER,
  created_at    INTEGER NOT NULL,
  FOREIGN KEY (bound_user_id) REFERENCES users(id),
  UNIQUE (provider, order_no)
);

CREATE INDEX IF NOT EXISTS idx_orders_bound_user ON orders(bound_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no   ON orders(order_no);

-- ------------------------------------------------------------
-- products
--
-- A product is whatever the user wants to license: a game, an app,
-- a plugin, etc. `product_uid` is the short ID embedded in the
-- license file (public, non-secret).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  product_uid TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_user       ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_uid        ON products(product_uid);

-- ------------------------------------------------------------
-- licenses
--
-- One row per issuance. The same user can issue licenses for the
-- same product multiple times (different machines, re-downloads),
-- and each issuance gets its own row for auditing.
--
-- `banned` is a logical flag. `ban_reason` is shown on the public
-- lookup page when the license is revoked.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licenses (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  issued_at   INTEGER NOT NULL,
  banned      INTEGER NOT NULL DEFAULT 0,
  manual      INTEGER NOT NULL DEFAULT 0,
  note        TEXT    NOT NULL DEFAULT '',
  ban_reason  TEXT    NOT NULL DEFAULT '',
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user    ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_banned  ON licenses(banned);

-- ------------------------------------------------------------
-- audit_log
--
-- Every admin action lands here. Not exposed to users.
-- `admin_id` stores the admin username (not a user id) because
-- admins are not rows in the users table.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  admin_id   TEXT NOT NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
