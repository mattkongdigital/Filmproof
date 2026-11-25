// lib/news.js — the news feed's data, at build time.
//
// Each news type has a loader returning items in the shared shape (see "News"
// in CLAUDE.md). This file merges them, drops anything held for review,
// resolves links against the current catalogue, and slices the result into
// the rolling /news/ window and the weekly archives. The page components only
// ever see the merged list, so adding a type is a loader here and an entry in
// NEWS_TYPES (./news-format.mjs), nothing else.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getFilm, resolveLegacyFilm } from './data';
import { STORES } from './stores';
import { NEWS_TYPES, NEWS_WINDOW_DAYS, isoWeek, addDays, ukDay } from './news-format.mjs';

// Paths are relative to web/, where `next build` runs.
const readJson = (rel) => {
  const file = join(process.cwd(), rel);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
};

const LOADERS = {
  // Written by build-news.js from the catalogue-state branch each build.
  'shop-update': () => readJson('data/news/shop-updates.json'),
  // Retailers' own blog posts, read from their feeds by build-news.js.
  'shop-news': () => readJson('data/news/shop-news.json'),
  // The weekly round-up, drafted by industry-news/ and landed through a
  // reviewed PR. Held items (`publish: false`) are dropped below.
  'industry-news': () => readJson('content/news/industry-news.json'),
};

const storeByName = new Map(STORES.map((s) => [s.name, s]));

// A film link only while there is a page behind it. A slug retired by a merge
// follows LEGACY_FILM_SLUGS to the survivor; a film that has left the
// catalogue keeps its name, unlinked, rather than pointing at a 404.
function filmHref(slug) {
  if (!slug) return null;
  if (getFilm(slug)) return `/film/${slug}/`;
  const legacy = resolveLegacyFilm(slug);
  return legacy ? `/film/${legacy.slug}/` : null;
}

function resolve(item) {
  const store = item.source?.kind === 'retailer' ? storeByName.get(item.source.name) : null;
  return {
    ...item,
    source: { ...item.source, href: store ? `/store/${store.slug}/` : item.source?.href ?? null },
    ...(item.film ? { film: { ...item.film, href: filmHref(item.film.slug) } } : {}),
    children: (item.children || []).map((c) => ({
      ...c,
      ...(c.film ? { film: { ...c.film, href: filmHref(c.film.slug) } } : {}),
      ...(c.retailer ? { storeHref: storeByName.has(c.retailer) ? `/store/${storeByName.get(c.retailer).slug}/` : null } : {}),
    })),
  };
}

// Within a day, an item a change earned on its own sits above the shops'
// routine roll-ups, so a new film or a long-awaited restock is not buried.
const rank = (it) => (it.kind === 'rollup' ? 1 : 0);

let cache = null;
export function allNews() {
  if (cache) return cache;
  const known = new Set(NEWS_TYPES.map((t) => t.id));
  cache = Object.entries(LOADERS)
    .flatMap(([type, load]) => load().map((it) => ({ ...it, type: it.type || type })))
    .filter((it) => known.has(it.type) && it.publish !== false)
    .map(resolve)
    .sort((a, b) => b.date.localeCompare(a.date) || rank(a) - rank(b) || b.firstSeenAt.localeCompare(a.firstSeenAt) || a.id.localeCompare(b.id));
  return cache;
}

// What /news/ shows: the last NEWS_WINDOW_DAYS UK days, today included.
export function recentNews(today = ukDay()) {
  const from = addDays(today, -(NEWS_WINDOW_DAYS - 1));
  return allNews().filter((it) => it.date >= from);
}

export const newsWeekOf = (it) => isoWeek(it.date);

// Every week with something in it, newest first.
export function newsWeeks() {
  return [...new Set(allNews().map(newsWeekOf))].sort().reverse();
}

// The archive route's paths: every week with items, plus the current week.
// `output: 'export'` refuses a dynamic route with no paths, and the first build
// after launch has no items, so the current week is always built (noindex
// while it is empty).
export function newsWeekParams(today = ukDay()) {
  return [...new Set([isoWeek(today), ...newsWeeks()])].map((week) => ({ week }));
}

export function weekNews(week) {
  return allNews().filter((it) => newsWeekOf(it) === week);
}
