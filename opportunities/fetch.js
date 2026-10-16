// opportunities/fetch.js
// Step 1 of a run (see opportunities/RUNBOOK.md). Reads every source's feed,
// drops what has been read before, and saves each new item's page as text plus
// its links, ready for extraction. Nothing here decides what is an
// opportunity — it only gathers what will be read.
//
//   node opportunities/fetch.js
//
// Writes, all under opportunities/work/ (gitignored, recreated each run):
//   candidates.json     the new items to read, one per feed item
//   pages/<id>.json     { url, fetched, text, links } for each fetched page
//   sources.json        how each source fared, for the review PR

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { OPPORTUNITY_SOURCES, PREFILTER_WORDS } from './sources.config.js';
import { normaliseUrl, htmlToText, extractLinks, parseFeed, politeFetch } from './lib.js';
import { WORK, SEEN_PATH, savePage, pageId } from './paths.js';

// A feed item older than this is marked seen without being read: anything
// posted half a year ago has almost always closed, and the first run would
// otherwise spend its time on a site's whole back catalogue.
const MAX_AGE_DAYS = 180;

const seen = existsSync(SEEN_PATH) ? JSON.parse(readFileSync(SEEN_PATH, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);

rmSync(WORK, { recursive: true, force: true });
mkdirSync(`${WORK}/pages`, { recursive: true });

const candidates = [];
const report = [];
const tooOld = [];

for (const src of OPPORTUNITY_SOURCES) {
  let items = null;
  let feedUsed = null;
  const errors = [];
  for (const feed of src.feeds) {
    try {
      const { body } = await politeFetch(feed);
      const parsed = parseFeed(body);
      if (parsed.length) { items = parsed; feedUsed = feed; break; }
      errors.push(`${feed}: no items`);
    } catch (e) {
      errors.push(`${feed}: ${e.message}`);
    }
  }
  if (!items) {
    console.warn(`  ${src.id}: no working feed — ${errors.join('; ')}`);
    report.push({ id: src.id, name: src.name, ok: false, errors });
    continue;
  }

  let fresh = 0, skippedSeen = 0, skippedFilter = 0, skippedOld = 0;
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

    if (src.prefilter) {
      const hay = `${item.title}\n${htmlToText(item.html)}`.toLowerCase();
      if (!PREFILTER_WORDS.some((w) => hay.includes(w))) {
        // Not marked seen: a post can be edited to add a call later, and the
        // prefilter costs nothing to re-run.
        skippedFilter++;
        continue;
      }
    }

    // The item's own page, for the full text and every link on it. The feed
    // body is the fallback when the page itself won't come.
    let page;
    try {
      const { url, body } = await politeFetch(item.url);
      page = { url, text: htmlToText(body), links: extractLinks(body, url) };
    } catch (e) {
      console.warn(`  ${src.id}: page fetch failed for ${item.url} (${e.message}); using feed body`);
      page = { url: item.url, text: htmlToText(item.html), links: extractLinks(item.html, item.url) };
    }
    const id = pageId(item.url);
    savePage(id, { ...page, fetched: today });
    candidates.push({
      id,
      source: src.id,
      item_url: item.url,
      title: item.title,
      published: published && !isNaN(published) ? published.toISOString().slice(0, 10) : null,
    });
    fresh++;
  }
  console.log(`  ${src.id}: ${items.length} in feed — ${fresh} new, ${skippedSeen} seen, ${skippedFilter} filtered, ${skippedOld} too old`);
  report.push({ id: src.id, name: src.name, ok: true, feed: feedUsed, inFeed: items.length, fresh, skippedSeen, skippedFilter, skippedOld });
}

writeFileSync(`${WORK}/candidates.json`, JSON.stringify(candidates, null, 2) + '\n');
writeFileSync(`${WORK}/sources.json`, JSON.stringify({ today, sources: report, tooOld }, null, 2) + '\n');

const live = report.filter((r) => r.ok).length;
console.log(`\n${candidates.length} candidate(s) from ${live}/${OPPORTUNITY_SOURCES.length} source(s) → ${WORK}/candidates.json`);
