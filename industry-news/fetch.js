// industry-news/fetch.js
// Step 1 of a run (see industry-news/RUNBOOK.md). Reads every source's feed,
// drops what has been read before and anything older than MAX_AGE_DAYS, and
// saves each new item's page as text, ready for the session to read. Nothing
// here decides what is news; it only gathers what will be read.
//
//   node industry-news/fetch.js
//
// Writes, under industry-news/work/ (gitignored, recreated each run):
//   candidates.json   the new items to read, one per feed item
//   pages/<id>.json   { url, fetched, text } for each fetched page
//   sources.json      how each source fared, for the review PR

import '../opportunities/proxy.js';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { INDUSTRY_SOURCES, ANTHROPIC_AGENTS } from './sources.config.js';
import { normaliseUrl, htmlToText, parseFeed, politeFetch, robotsFor, robotsAllows } from '../opportunities/lib.js';
import { WORK, SEEN_PATH, savePage, pageId } from './paths.js';
import { ukDay } from '../web/lib/news-format.mjs';

// The round-up is weekly, so a story more than a fortnight old is no longer
// news. Older items are marked seen without being read, which is also what
// keeps a new source's back catalogue out of its first round-up.
const MAX_AGE_DAYS = 14;

const seen = existsSync(SEEN_PATH) ? JSON.parse(readFileSync(SEEN_PATH, 'utf8')) : {};
const today = ukDay();

// A Claude session reads every page saved here, so a site that turns away
// Anthropic's crawlers is skipped even where it allows FilmproofBot.
async function anthropicRefused(url) {
  const u = new URL(url);
  const txt = await robotsFor(url);
  return ANTHROPIC_AGENTS.filter((a) => !robotsAllows(txt, u.pathname + u.search, a));
}

// A general photography site mentions film in passing all the time (a
// "film camera look" phone mode, a retro digital body), and its feeds carry
// whole articles. So an item is about film when a film word is in its title,
// or at least two different ones are in its text. Whole words only, so that
// "portra" is not found inside "portrait".
function aboutFilm(item, words) {
  const has = (text) => words.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  return has(item.title).length > 0 || has(htmlToText(item.html)).length >= 2;
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(`${WORK}/pages`, { recursive: true });

const candidates = [];
const report = [];
const tooOld = [];

for (const src of INDUSTRY_SOURCES) {
  let items = null;
  let feedUsed = null;
  const errors = [];
  for (const feed of src.feeds) {
    try {
      const refused = await anthropicRefused(feed);
      if (refused.length) { errors.push(`${feed}: robots.txt refuses ${refused.join(', ')}; not a source for a Claude-read pipeline`); continue; }
      const { body } = await politeFetch(feed);
      const parsed = parseFeed(body);
      if (!parsed.length) { errors.push(`${feed}: no items`); continue; }
      items = parsed;
      feedUsed = feed;
      break;
    } catch (e) {
      errors.push(`${feed}: ${e.message}`);
    }
  }
  if (!items) {
    console.warn(`  ${src.id}: no working feed (${errors.join('; ')})`);
    report.push({ id: src.id, name: src.name, ok: false, errors });
    continue;
  }

  let fresh = 0, skippedSeen = 0, skippedFilter = 0, skippedOld = 0, skippedRobots = 0;
  for (const item of items) {
    const key = normaliseUrl(item.url);
    if (!key) continue;
    if (seen[key]) { skippedSeen++; continue; }

    const published = item.published ? new Date(item.published) : null;
    if (published && !isNaN(published) && (Date.now() - published) / 864e5 > MAX_AGE_DAYS) {
      tooOld.push(key);
      skippedOld++;
      continue;
    }

    // Not marked seen: a filtered item costs nothing to test again.
    if (src.prefilter && !aboutFilm(item, src.prefilter)) { skippedFilter++; continue; }

    if ((await anthropicRefused(item.url)).length) { skippedRobots++; continue; }

    // The item's own page, for the full story. The feed body is the fallback
    // when the page itself won't come.
    let page;
    try {
      const { url, body } = await politeFetch(item.url);
      page = { url, text: htmlToText(body) };
    } catch (e) {
      console.warn(`  ${src.id}: page fetch failed for ${item.url} (${e.message}); using feed body`);
      page = { url: item.url, text: htmlToText(item.html) };
    }
    const id = pageId(item.url);
    savePage(id, { ...page, fetched: today });
    candidates.push({
      id,
      source: src.id,
      item_url: item.url,
      title: item.title,
      published: published && !isNaN(published) ? ukDay(published) : null,
    });
    fresh++;
  }
  console.log(`  ${src.id}: ${items.length} in feed, ${fresh} new, ${skippedSeen} seen, ${skippedFilter} filtered, ${skippedOld} too old${skippedRobots ? `, ${skippedRobots} refused by robots.txt` : ''}`);
  report.push({ id: src.id, name: src.name, ok: true, feed: feedUsed, inFeed: items.length, fresh, skippedSeen, skippedFilter, skippedOld, skippedRobots });
}

writeFileSync(`${WORK}/candidates.json`, JSON.stringify(candidates, null, 2) + '\n');
writeFileSync(`${WORK}/sources.json`, JSON.stringify({ today, sources: report, tooOld }, null, 2) + '\n');

const live = report.filter((r) => r.ok).length;
console.log(`\n${candidates.length} candidate(s) from ${live}/${INDUSTRY_SOURCES.length} source(s) → ${WORK}/candidates.json`);
