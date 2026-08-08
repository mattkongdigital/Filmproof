// ingest.js — the real, database-backed version of demo.js
// Requires: npm i pg  and  a DATABASE_URL env var pointing at a DB with schema.sql applied.
//   DATABASE_URL=postgres://user:pass@localhost:5432/film node ingest.js
//
// Run it on a schedule (cron / GitHub Action). Each run:
//   fetch feeds -> match -> upsert matched offers -> queue the rest ->
//   mark anything not seen this run as out of stock.

import pkg from 'pg';
import { matchOffer } from './src/match.js';
import { loadWex } from './src/adapters/wex.js';
import { loadNikTrick } from './src/adapters/niktrick.js';

const { Client } = pkg;

// Register each retailer's adapter here. In production `source` would be the
// feed URL fetched over HTTP rather than a local sample file.
const SOURCES = [
  { name: 'Wex Photo Video', load: () => loadWex('./data/wex-sample.xml') },
  { name: 'Nik & Trick',     load: () => loadNikTrick('./data/niktrick-sample.csv') },
];

async function loadCatalogue(db) {
  const { rows } = await db.query('SELECT id, match_key FROM films');
  return new Map(rows.map((r) => [r.match_key, { id: r.id }]));
}

async function retailerId(db, name) {
  const found = await db.query('SELECT id FROM retailers WHERE name = $1', [name]);
  if (found.rows.length) return found.rows[0].id;
  const ins = await db.query(
    'INSERT INTO retailers (name) VALUES ($1) RETURNING id', [name],
  );
  return ins.rows[0].id;
}

async function run() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const filmByKey = await loadCatalogue(db);
  const runStart = new Date();

  for (const src of SOURCES) {
    const rid = await retailerId(db, src.name);
    const offers = src.load();

    for (const raw of offers) {
      const result = matchOffer(raw, filmByKey);

      if (result.status !== 'matched') {
        await db.query(
          `INSERT INTO review_queue
             (retailer_id, retailer_sku, retailer_title, price, parsed_key, reason)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [rid, raw.retailerSku, raw.title, raw.price, result.parsed.key, result.reason],
        );
        continue;
      }

      const o = result.offer;
      await db.query(
        `INSERT INTO offers
           (film_id, retailer_id, retailer_sku, retailer_title,
            price, pack_size, price_per_roll, in_stock, product_url, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
         ON CONFLICT (retailer_id, retailer_sku) DO UPDATE SET
           price          = EXCLUDED.price,
           pack_size      = EXCLUDED.pack_size,
           price_per_roll = EXCLUDED.price_per_roll,
           in_stock       = EXCLUDED.in_stock,
           product_url    = EXCLUDED.product_url,
           last_seen_at   = now()`,
        [result.filmId, rid, raw.retailerSku, raw.title,
         raw.price, o.packSize, o.pricePerRoll, raw.inStock, raw.url],
      );
    }

    // Anything from this retailer not touched this run has dropped out of the
    // feed — treat as out of stock rather than deleting (keeps history intact).
    await db.query(
      'UPDATE offers SET in_stock = FALSE WHERE retailer_id = $1 AND last_seen_at < $2',
      [rid, runStart],
    );
  }

  await db.end();
  console.log('Ingest complete.');
}

run().catch((err) => { console.error(err); process.exit(1); });
