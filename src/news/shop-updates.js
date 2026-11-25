// src/news/shop-updates.js — what changed in the catalogue since the last build.
//
// Pure: given the previous snapshot and this build's site.json, returns the
// next snapshot and the news items the changes earn. build-news.js does the
// file reading and writing; src/news/test.js checks the rules without a network.
//
// Changes are tracked per (film key, retailer). The key is the normaliser's
// matching key, which a shop retitling a listing does not move; the slug is
// read from the first shop's title, so it is carried only to build links. See
// "News" in CLAUDE.md for the snapshot and the item model.

import { ukDay, daysBetween, rollupTitle, CHANGES } from '../../web/lib/news-format.mjs';

export const SNAPSHOT_VERSION = 1;

export const THRESHOLDS = {
  // A film out of stock at every shop for at least this long earns its own
  // item when it comes back. Shorter gaps are usually a feed blip.
  outEverywhereDays: 3,
  // A film back at one shop after at least this long earns its own item even
  // while other shops had it.
  retailerGapDays: 60,
  // A price drop counts only at both of these, so rounding and penny moves
  // stay out of the feed.
  dropShare: 0.03,
  dropAmount: 0.25,
  // A shop whose changes in one build exceed BOTH of these is treated as a
  // broken or restructured feed: its changes are skipped and its rows kept.
  implausibleCount: 25,
  implausibleShare: 0.3,
  // After this many consecutive skips the shop's feed is taken as its new
  // normal and its rows re-seeded silently, so one restructure cannot freeze
  // a shop out of the feed for good.
  reseedAfterSkips: 3,
};

const round2 = (n) => Math.round(n * 100) / 100;
const rowId = (key, retailer) => `${key}|${retailer}`;
const splitId = (id) => { const i = id.indexOf('|'); return [id.slice(0, i), id.slice(i + 1)]; };
export const retailerSlug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function emptySnapshot() {
  return { version: SNAPSHOT_VERSION, builtAt: null, retailers: {}, films: {}, offers: {} };
}

// This build's catalogue reduced to one row per (key, retailer). "In stock" is
// any of that shop's offers for the film being in stock. The price is the
// cheapest in-stock single-item offer, the same filter the Product JSON-LD's
// AggregateOffer uses (components/product-schema.js): a multipack's price is
// not the price of one roll, so it never stands in for one.
export function currentRows(site) {
  const films = new Map();
  const offers = new Map();
  for (const f of site) {
    const key = f.key || f.slug;
    films.set(key, { slug: f.slug, display: f.display, brand: f.brand ?? null, format: f.format ?? null });
    const byShop = new Map();
    for (const o of f.offers || []) {
      if (!byShop.has(o.retailer)) byShop.set(o.retailer, []);
      byShop.get(o.retailer).push(o);
    }
    for (const [retailer, list] of byShop) {
      const singles = list.filter((o) => o.inStock && (o.packSize || 1) === 1 && Number.isFinite(o.price) && o.price > 0);
      const cheapest = singles.sort((a, b) => a.price - b.price)[0] || null;
      const shown = cheapest || list.find((o) => o.inStock) || list[0];
      offers.set(rowId(key, retailer), {
        key, retailer,
        inStock: list.some((o) => o.inStock),
        price: cheapest ? round2(cheapest.price) : null,
        url: shown.url || null,
      });
    }
  }
  return { films, offers };
}

// A merge in the normaliser changes a film's key, and sometimes its slug. Left
// alone, the old key would read as a film leaving and the new one as a film
// arriving at every shop that stocks it. A new key is the old film renamed
// when it took over the old one's slug, or when LEGACY_FILM_SLUGS points the
// old slug at it. Its history moves across, so nothing about it is news.
function carryRenames(state, cur, legacy) {
  const renames = [];
  const bySlug = new Map(Object.entries(state.films).map(([k, f]) => [f.slug, k]));
  for (const [key, film] of cur.films) {
    if (state.films[key]) continue;
    let from = bySlug.get(film.slug);
    if (!from || cur.films.has(from)) {
      from = Object.keys(state.films).find((k) => !cur.films.has(k) && legacy[state.films[k].slug] === film.slug);
    }
    if (!from || cur.films.has(from)) continue;
    state.films[key] = state.films[from];
    delete state.films[from];
    for (const id of Object.keys(state.offers)) {
      const [k, r] = splitId(id);
      if (k !== from) continue;
      if (!state.offers[rowId(key, r)]) state.offers[rowId(key, r)] = state.offers[id];
      delete state.offers[id];
    }
    renames.push({ from, to: key });
  }
  return renames;
}

// Everything that changed for one shop, measured against its snapshot rows.
function shopChanges(state, cur, retailer, t) {
  const changes = [];
  let moves = 0;
  const now = [...cur.offers.values()].filter((o) => o.retailer === retailer);
  const nowIds = new Set(now.map((o) => rowId(o.key, retailer)));
  const prevIds = Object.keys(state.offers).filter((id) => splitId(id)[1] === retailer);
  for (const o of now) {
    const p = state.offers[rowId(o.key, retailer)];
    if (!p) {
      moves++;
      if (o.inStock) changes.push({ change: 'new', key: o.key, retailer, price: o.price, url: o.url });
    } else if (!p.inStock && o.inStock) {
      moves++;
      changes.push({ change: 'restock', key: o.key, retailer, price: o.price, url: o.url, outDays: daysBetween(p.stockSince, state._today) });
    } else if (p.inStock && !o.inStock) {
      moves++;
    } else if (p.inStock && o.inStock && p.price != null && o.price != null) {
      const drop = p.price - o.price;
      if (drop >= t.dropAmount && drop / p.price >= t.dropShare) {
        moves++;
        changes.push({ change: 'price-drop', key: o.key, retailer, price: o.price, was: p.price, url: o.url });
      }
    }
  }
  for (const id of prevIds) if (!nowIds.has(id) && state.offers[id].listed) moves++;
  const listedBefore = prevIds.filter((id) => state.offers[id].listed).length;
  return { changes, moves, rows: Math.max(listedBefore, now.length, 1), now, prevIds };
}

// Write one shop's current rows into the snapshot. Retailer URLs are not
// stored: a news line links to the offer as this build has it, and a stored
// link to a listing that has since gone would only lead to the shop's 404.
function applyShop(state, retailer, now, prevIds, today) {
  const nowIds = new Set();
  for (const o of now) {
    const id = rowId(o.key, retailer);
    nowIds.add(id);
    const p = state.offers[id];
    state.offers[id] = {
      firstSeen: p ? p.firstSeen : today,
      listed: true,
      inStock: o.inStock,
      stockSince: p && p.inStock === o.inStock ? p.stockSince : today,
      price: o.price,
      // The last single-item price seen in stock, kept through sell-outs and
      // delistings: what a tombstone page would quote as "last listed at".
      lastPrice: o.price ?? (p ? p.lastPrice : null),
    };
  }
  // A listing gone from the feed is kept as unlisted and out of stock, so it
  // coming back is a restock (or nothing) rather than a new listing.
  for (const id of prevIds) {
    if (nowIds.has(id)) continue;
    const p = state.offers[id];
    if (!p.listed && !p.inStock) continue;
    state.offers[id] = { ...p, listed: false, inStock: false, price: null, stockSince: p.inStock ? today : p.stockSince };
  }
}

const byDisplay = (films) => (a, b) =>
  CHANGES.indexOf(a.change) - CHANGES.indexOf(b.change) ||
  (films[a.key]?.display || '').localeCompare(films[b.key]?.display || '') ||
  a.retailer.localeCompare(b.retailer);

function child(ch, films) {
  const f = films[ch.key] || {};
  return {
    change: ch.change,
    film: { key: ch.key, slug: f.slug, display: f.display, format: f.format ?? null },
    retailer: ch.retailer,
    offerUrl: ch.url,
    ...(ch.price != null ? { price: ch.price } : {}),
    ...(ch.was != null ? { was: ch.was } : {}),
    ...(ch.outDays != null ? { outDays: ch.outDays } : {}),
  };
}

// The whole diff. `prev` is the previous snapshot, or null on a first run;
// `legacy` is LEGACY_FILM_SLUGS; `accept` names shops whose implausible diff
// should be taken this once (FILMPROOF_NEWS_ACCEPT), silently.
export function diffCatalogue({ prev, site, now = new Date(), legacy = {}, accept = new Set(), t = THRESHOLDS }) {
  const today = ukDay(now);
  const firstRun = !prev;
  const state = firstRun ? emptySnapshot() : structuredClone(prev);
  state._today = today;
  const log = [];
  const cur = currentRows(site);
  const renames = firstRun ? [] : carryRenames(state, cur, legacy);
  for (const r of renames) log.push(`renamed ${r.from} -> ${r.to}`);
  const prevFilms = structuredClone(state.films);

  const shops = [...new Set([...cur.offers.values()].map((o) => o.retailer))].sort();
  const events = [];
  for (const retailer of shops) {
    const known = state.retailers[retailer];
    const { changes, moves, rows, now: rowsNow, prevIds } = shopChanges(state, cur, retailer, t);
    if (firstRun || !known) {
      applyShop(state, retailer, rowsNow, prevIds, today);
      state.retailers[retailer] = { firstSeen: today, skips: 0 };
      log.push(`${retailer}: seeded ${rowsNow.length} listings silently (${firstRun ? 'first run' : 'new shop'})`);
      continue;
    }
    if (moves > t.implausibleCount && moves > t.implausibleShare * rows && !accept.has(retailer)) {
      const skips = (known.skips || 0) + 1;
      if (skips < t.reseedAfterSkips) {
        state.retailers[retailer] = { ...known, skips };
        log.push(`WARNING ${retailer}: ${moves} changes across ${rows} listings looks like a broken feed; skipped this run (${skips} in a row), snapshot rows kept`);
        continue;
      }
      applyShop(state, retailer, rowsNow, prevIds, today);
      state.retailers[retailer] = { ...known, skips: 0 };
      log.push(`WARNING ${retailer}: ${moves} changes for ${skips} runs in a row; taken as the shop's new normal and re-seeded silently`);
      continue;
    }
    if (accept.has(retailer) && moves > t.implausibleCount && moves > t.implausibleShare * rows) {
      applyShop(state, retailer, rowsNow, prevIds, today);
      state.retailers[retailer] = { ...known, skips: 0 };
      log.push(`${retailer}: ${moves} changes accepted silently (FILMPROOF_NEWS_ACCEPT)`);
      continue;
    }
    applyShop(state, retailer, rowsNow, prevIds, today);
    state.retailers[retailer] = { ...known, skips: 0 };
    events.push(...changes);
    if (changes.length) log.push(`${retailer}: ${changes.length} changes`);
  }

  // A shop that has left SOURCES contributes nothing now. Its rows go unlisted
  // silently so they no longer count as stock anywhere.
  for (const retailer of Object.keys(state.retailers)) {
    if (shops.includes(retailer)) continue;
    const ids = Object.keys(state.offers).filter((id) => splitId(id)[1] === retailer);
    if (ids.some((id) => state.offers[id].listed)) log.push(`${retailer}: no longer in this build; its listings marked unlisted`);
    applyShop(state, retailer, [], ids, today);
  }

  // Film-level history, from the rows as they now stand (a skipped shop's
  // rows are its previous ones, so a skip never makes a film look sold out).
  const rowsByKey = new Map();
  for (const [id, row] of Object.entries(state.offers)) {
    const [k] = splitId(id);
    if (!rowsByKey.has(k)) rowsByKey.set(k, []);
    rowsByKey.get(k).push(row);
  }
  for (const key of new Set([...Object.keys(state.films), ...cur.films.keys()])) {
    const p = state.films[key];
    const meta = cur.films.get(key) || p;
    const rows = rowsByKey.get(key) || [];
    const inStock = rows.some((r) => r.inStock);
    const listed = rows.some((r) => r.listed);
    state.films[key] = {
      slug: meta.slug, display: meta.display, brand: meta.brand ?? null, format: meta.format ?? null,
      firstSeen: p ? p.firstSeen : today,
      lastListed: listed ? null : (p && p.lastListed) || today,
      outEverywhereSince: inStock ? null : (p && p.outEverywhereSince) || today,
    };
  }

  // Sort the changes into notable items and per-shop roll-ups.
  const items = [];
  const at = now.toISOString();
  const promoted = new Set();
  const byKey = new Map();
  for (const e of events) {
    if (!byKey.has(e.key)) byKey.set(e.key, []);
    byKey.get(e.key).push(e);
  }
  const notable = (kind, key, list, extra = {}) => {
    const f = state.films[key];
    list.forEach((e) => promoted.add(e));
    items.push({
      id: `shop-update:${today}:${kind}:${f.slug}${extra.idSuffix || ''}`,
      type: 'shop-update', kind, date: today, firstSeenAt: at,
      source: list.length === 1 ? { kind: 'retailer', name: list[0].retailer } : { kind: 'catalogue', name: 'Filmproof' },
      title: extra.title,
      summary: null,
      film: { key, slug: f.slug, display: f.display, format: f.format ?? null },
      children: list.sort(byDisplay(state.films)).map((e) => child(e, state.films)),
      ...(extra.outDays != null ? { outDays: extra.outDays } : {}),
    });
  };
  for (const [key, list] of byKey) {
    const was = prevFilms[key];
    const f = state.films[key];
    const arrivals = list.filter((e) => e.change === 'new');
    if (!was && arrivals.length) {
      notable('new-film', key, arrivals, { title: `New to Filmproof: ${f.display}` });
      continue;
    }
    const restocks = list.filter((e) => e.change === 'restock');
    if (!restocks.length || !was) continue;
    const outFor = was.outEverywhereSince ? daysBetween(was.outEverywhereSince, today) : 0;
    if (was.outEverywhereSince && outFor >= t.outEverywhereDays) {
      notable('back-everywhere', key, restocks, { title: `Back in stock: ${f.display}`, outDays: outFor });
      continue;
    }
    for (const e of restocks.filter((r) => r.outDays >= t.retailerGapDays)) {
      notable('back-at-shop', key, [e], { title: `Back at ${e.retailer}: ${f.display}`, outDays: e.outDays, idSuffix: `:${retailerSlug(e.retailer)}` });
    }
  }
  const routine = new Map();
  for (const e of events) {
    if (promoted.has(e)) continue;
    if (!routine.has(e.retailer)) routine.set(e.retailer, []);
    routine.get(e.retailer).push(e);
  }
  for (const [retailer, list] of [...routine].sort((a, b) => a[0].localeCompare(b[0]))) {
    const children = list.sort(byDisplay(state.films)).map((e) => child(e, state.films));
    items.push({
      id: `shop-update:${today}:rollup:${retailerSlug(retailer)}`,
      type: 'shop-update', kind: 'rollup', date: today, firstSeenAt: at,
      source: { kind: 'retailer', name: retailer },
      title: rollupTitle(retailer, children),
      summary: null,
      children,
    });
  }

  delete state._today;
  state.version = SNAPSHOT_VERSION;
  state.previousBuiltAt = prev ? prev.builtAt : null;
  state.builtAt = at;
  return { state, items, log, firstRun };
}

// Fold this build's items into the running log. A second build on the same UK
// day (a code push after the morning refresh) produces items with the same
// ids; their lists are merged rather than posted twice.
export function mergeIntoLog(log, items) {
  const out = [...log];
  const index = new Map(out.map((it, i) => [it.id, i]));
  for (const it of items) {
    if (!index.has(it.id)) { index.set(it.id, out.length); out.push(it); continue; }
    const old = out[index.get(it.id)];
    const keyOf = (c) => `${c.change}|${c.film.key}|${c.retailer}`;
    const merged = new Map(old.children.map((c) => [keyOf(c), c]));
    for (const c of it.children) merged.set(keyOf(c), c);
    const children = [...merged.values()];
    out[index.get(it.id)] = {
      ...old,
      children,
      ...(it.kind === 'rollup' ? { title: rollupTitle(it.source.name, children) } : {}),
    };
  }
  return out.sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt) || a.id.localeCompare(b.id));
}
