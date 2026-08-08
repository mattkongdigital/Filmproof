-- schema.sql — PostgreSQL
-- The core idea: one canonical `films` row per product; each shop selling it
-- is an `offers` row pointing back at it. Anything that can't be matched
-- confidently lands in `review_queue` instead of the live page.

CREATE TABLE films (
  id          SERIAL PRIMARY KEY,
  brand       TEXT NOT NULL,
  display     TEXT NOT NULL,             -- "Kodak Gold 200"
  format      TEXT NOT NULL,             -- 135 / 120 / 110
  iso         INTEGER NOT NULL,
  exposures   INTEGER,
  process     TEXT,                      -- C-41 / B&W / E-6
  is_colour   BOOLEAN DEFAULT TRUE,
  slug        TEXT UNIQUE NOT NULL,      -- for the URL
  match_key   TEXT UNIQUE NOT NULL,      -- kodak-gold-135-200-36
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE retailers (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  affiliate_network TEXT,                -- awin / impact / none
  base_url         TEXT,
  feed_url         TEXT,
  feed_type        TEXT,                 -- xml / csv
  active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE offers (
  id              SERIAL PRIMARY KEY,
  film_id         INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  retailer_id     INTEGER NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  retailer_sku    TEXT NOT NULL,
  retailer_title  TEXT NOT NULL,         -- raw feed title, kept for auditing
  price           NUMERIC(10,2) NOT NULL,
  pack_size       INTEGER NOT NULL DEFAULT 1,
  price_per_roll  NUMERIC(10,2) NOT NULL,-- the field the ranking sorts on
  in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
  product_url     TEXT NOT NULL,         -- includes your affiliate tag
  last_seen_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (retailer_id, retailer_sku)     -- one offer per shop listing
);

CREATE INDEX idx_offers_film       ON offers (film_id);
CREATE INDEX idx_offers_ppr        ON offers (film_id, price_per_roll);

-- Unmatched or low-confidence feed rows wait here for a human decision.
CREATE TABLE review_queue (
  id              SERIAL PRIMARY KEY,
  retailer_id     INTEGER REFERENCES retailers(id),
  retailer_sku    TEXT,
  retailer_title  TEXT NOT NULL,
  price           NUMERIC(10,2),
  parsed_key      TEXT,                  -- best guess, if any
  reason          TEXT NOT NULL,         -- incomplete_parse / no_canonical_match
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Convenience view: the cheapest in-stock offer per film.
CREATE VIEW best_offer AS
SELECT DISTINCT ON (film_id)
       film_id, retailer_id, price_per_roll, product_url
FROM   offers
WHERE  in_stock
ORDER  BY film_id, price_per_roll ASC;
