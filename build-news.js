// build-news.js
// Compare this build's catalogue (web/data/site.json) with the snapshot from
// the last deployed build, record what changed as shop-update news items, and
// write the next snapshot. Then read the shops' own blog feeds for shop-news
// items. Runs after build-site-data.js.
//
//   node build-news.js                    # reads and writes ./state
//   FILMPROOF_STATE_DIR=/tmp/s node build-news.js
//
// ./state is a checkout of the `catalogue-state` branch, which only the
// refresh workflow writes, and only after a successful deploy. Locally it is
// usually absent, so a local run seeds a snapshot of its own and posts
// nothing. See "News" in CLAUDE.md.

// First, before anything fetches: re-runs this script with Node's proxy
// support on when the environment routes traffic through HTTPS_PROXY.
import './opportunities/proxy.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { diffCatalogue, mergeIntoLog, SNAPSHOT_VERSION } from './src/news/shop-updates.js';
import { LEGACY_FILM_SLUGS } from './web/lib/legacy-slugs.mjs';
import { mergeShopNews } from './src/news/shop-news.js';
import { SHOP_FEEDS } from './src/news/shop-news-sources.js';
import { parseFeed, politeFetch } from './opportunities/lib.js';

const OFFLINE = process.env.FILMPROOF_OFFLINE === '1';
const STATE_DIR = process.env.FILMPROOF_STATE_DIR || './state';
const SNAPSHOT = join(STATE_DIR, 'catalogue-state.json');
const LOG = join(STATE_DIR, 'news', 'shop-updates.json');
const SHOP_NEWS = join(STATE_DIR, 'news', 'shop-news.json');
const WEB_DIR = './web/data/news';
const ACCEPT = new Set((process.env.FILMPROOF_NEWS_ACCEPT || '').split(',').map((s) => s.trim()).filter(Boolean));

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);

// One snapshot row per line, keys sorted, so a quiet day's commit to the
// state branch touches only the rows that changed.
function serialiseSnapshot(s) {
  const block = (obj) => {
    const keys = Object.keys(obj).sort();
    if (!keys.length) return '{}';
    return '{\n' + keys.map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`).join(',\n') + '\n  }';
  };
  return [
    '{',
    `  "version": ${JSON.stringify(s.version)},`,
    `  "builtAt": ${JSON.stringify(s.builtAt)},`,
    `  "previousBuiltAt": ${JSON.stringify(s.previousBuiltAt ?? null)},`,
    `  "retailers": ${block(s.retailers)},`,
    `  "films": ${block(s.films)},`,
    `  "offers": ${block(s.offers)}`,
    '}',
    '',
  ].join('\n');
}

// The site reads each type's log from web/data/news/<type file>.
function publish(file, log) {
  mkdirSync(WEB_DIR, { recursive: true });
  writeFileSync(join(WEB_DIR, file), JSON.stringify(log));
}

function shopUpdates() {
  const log = readJson(LOG, []);
  if (OFFLINE) {
    // A sample build is not the real catalogue: diffing it would post a
    // sell-out of everything. Publish whatever news is on file and stop.
    publish('shop-updates.json', log);
    console.log(`News: offline build, snapshot left alone; ${log.length} shop updates on file.`);
    return;
  }

  const site = JSON.parse(readFileSync('./web/data/site.json', 'utf8'));
  const prev = readJson(SNAPSHOT, null);
  if (prev && prev.version !== SNAPSHOT_VERSION) {
    throw new Error(`${SNAPSHOT} is version ${prev.version}; this build reads ${SNAPSHOT_VERSION}. Migrate it rather than re-seeding, or its history is lost.`);
  }

  const { state, items, log: lines, firstRun } = diffCatalogue({ prev, site, legacy: LEGACY_FILM_SLUGS, accept: ACCEPT });
  for (const l of lines) (l.startsWith('WARNING') ? console.warn : console.log)(`  ${l}`);
  if (firstRun) console.log(`News: no snapshot at ${SNAPSHOT}, so this is a first run. Seeded it; nothing posted.`);
  else console.log(`News: changes since ${prev.builtAt}: ${items.length} items (${items.filter((i) => i.kind !== 'rollup').length} notable).`);

  const next = mergeIntoLog(log, items);
  mkdirSync(join(STATE_DIR, 'news'), { recursive: true });
  writeFileSync(SNAPSHOT, serialiseSnapshot(state));
  writeFileSync(LOG, JSON.stringify(next, null, 1) + '\n');
  publish('shop-updates.json', next);
}

// Shop blogs. A feed that fails is logged and skipped, never fatal: its posts
// already on file stay, and anything it published meanwhile is picked up on a
// later build as long as it is still inside the window.
async function shopNews() {
  const log = readJson(SHOP_NEWS, []);
  if (OFFLINE) {
    publish('shop-news.json', log);
    console.log(`Shop news: offline build, feeds not read; ${log.length} posts on file.`);
    return;
  }
  const fetched = [];
  for (const shop of SHOP_FEEDS) {
    for (const url of shop.feeds) {
      try {
        const { body } = await politeFetch(url);
        const entries = parseFeed(body);
        fetched.push({ retailer: shop.retailer, filmOnly: shop.filmOnly === true, entries });
      } catch (e) {
        console.warn(`  WARNING shop news: ${shop.retailer} feed ${url} failed (${e.message}); skipped this build`);
      }
    }
  }
  const { log: next, added, skippedOld, skippedOffTopic } = mergeShopNews({ log, fetched });
  for (const it of added) console.log(`  ${it.source.name}: ${it.date} ${it.title}`);
  console.log(`Shop news: ${fetched.length} feeds read, ${added.length} new posts (${skippedOld} older than the window, ${skippedOffTopic} not about film).`);
  mkdirSync(join(STATE_DIR, 'news'), { recursive: true });
  writeFileSync(SHOP_NEWS, JSON.stringify(next, null, 1) + '\n');
  publish('shop-news.json', next);
}

shopUpdates();
await shopNews();
