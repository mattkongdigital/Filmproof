// industry-news/merge.js
// Step 3 of a run (see industry-news/RUNBOOK.md). Checks the session's draft
// against the pages fetched for it and writes the files the review PR carries:
//
//   web/content/news/industry-news.json   this week's round-up, publish: false
//   industry-news/seen.json               every item read, so it never is again
//   industry-news/work/review.md          the PR body
//
//   node industry-news/merge.js
//
// Exits non-zero, writing nothing, if the draft is malformed: a half-merged
// run is worse than none.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { INDUSTRY_SOURCES } from './sources.config.js';
import { normaliseUrl } from '../opportunities/lib.js';
import { buildRoundup, CATEGORIES } from './roundup.js';
import { WORK, SEEN_PATH, CONTENT_PATH, loadPage } from './paths.js';

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);
const fail = (msg) => { console.error(`merge: ${msg}`); process.exit(1); };

const candidates = readJson(`${WORK}/candidates.json`, null) || fail('no work/candidates.json; run fetch.js first');
const draft = readJson(`${WORK}/extractions.json`, null) || fail('no work/extractions.json; nothing was drafted');
const sourcesRun = readJson(`${WORK}/sources.json`, { today: null, sources: [], tooOld: [] });
const seen = readJson(SEEN_PATH, {});
const content = readJson(CONTENT_PATH, []);
const today = sourcesRun.today || fail('work/sources.json has no date; run fetch.js first');

const sourceNames = Object.fromEntries(INDUSTRY_SOURCES.map((s) => [s.id, s.name]));
const pages = new Map(candidates.map((c) => [c.id, loadPage(c.id)]));

let result;
try {
  result = buildRoundup({ draft, candidates, pages, sourceNames, content, today });
} catch (e) {
  fail(e.message);
}
const { content: next, item, added, dropped, introReview, skipped, unread, read } = result;

for (const c of candidates) if (read.has(c.id)) seen[normaliseUrl(c.item_url)] = today;
for (const key of sourcesRun.tooOld || []) seen[key] ??= today;

mkdirSync(dirname(CONTENT_PATH), { recursive: true });
writeFileSync(SEEN_PATH, JSON.stringify(Object.fromEntries(Object.entries(seen).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
writeFileSync(CONTENT_PATH, JSON.stringify(next, null, 2) + '\n');

// ---------------------------------------------------------------------------
// The review PR body

const label = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
const byCandidate = new Map(candidates.map((c) => [c.id, c]));
const lines = [];
lines.push(`Weekly industry news round-up, drafted ${today}.`, '');
lines.push(item
  ? `**${added.length} new ${added.length === 1 ? 'story' : 'stories'}** in this week's round-up (${item.children.length} in all), ${dropped.length} dropped, ${skipped.length} not news.`
  : `**No round-up this week**: nothing new passed. ${dropped.length} dropped, ${skipped.length} not news.`, '');
lines.push('Nothing here is live, even once merged: the round-up is `publish: false`. To publish it, set `publish` to `true` on the item in `web/content/news/industry-news.json` in this PR, and change its `date` to today if you are publishing on a later day. To drop a story, delete it from `children`; `seen.json` keeps it from coming back. Edit any headline or summary in place.', '');

if (item) {
  lines.push('## Intro', '', item.summary || '_none_', '');
  if (introReview.length) lines.push(`> ⚠️ ${introReview.join('; ')}`, '');
  lines.push('## Stories', '');
  for (const { story, review } of added) {
    lines.push(`### ${story.headline}`, '');
    lines.push(`_${label[story.category]}${story.published ? `, published ${story.published}` : ''}_`, '');
    lines.push(story.summary, '');
    lines.push(story.links.map((l) => `[${l.name}](${l.url})`).join(' · '), '');
    if (review.length) lines.push(`> ⚠️ ${review.join('; ')}`, '');
  }
}

if (dropped.length) {
  lines.push('## Dropped', '', 'Drafted as stories but not added. Add one by hand if it should be there.', '');
  for (const d of dropped) {
    const c = byCandidate.get([d.raw?.candidates ?? []].flat()[0]);
    lines.push(`- ${d.raw?.headline || c?.title || '(untitled)'}${c ? ` ([source](${c.item_url}))` : ''}: ${d.reason}`);
  }
  lines.push('');
}

if (skipped.length) {
  lines.push(`<details><summary>Not news (${skipped.length})</summary>`, '');
  for (const s of skipped) {
    const c = byCandidate.get(s.candidate);
    lines.push(`- ${c ? `[${c.title}](${c.item_url})` : s.candidate}: ${s.reason || 'no reason given'}`);
  }
  lines.push('', '</details>', '');
}

lines.push('## Sources', '');
for (const s of sourcesRun.sources) {
  lines.push(s.ok
    ? `- ${s.name}: ${s.inFeed} in feed, ${s.fresh} new, ${s.skippedSeen} seen, ${s.skippedFilter} filtered out, ${s.skippedOld} too old${s.skippedRobots ? `, ${s.skippedRobots} refused by robots.txt` : ''}`
    : `- ⚠️ ${s.name}: **no working feed**: ${s.errors.join('; ')}`);
}
if (unread.length) lines.push('', `⚠️ ${unread.length} candidate(s) were not read this run and will come round again next week.`);

writeFileSync(`${WORK}/review.md`, lines.join('\n') + '\n');
console.log(`${added.length} stories added${item ? ` to ${item.id}` : ''}, ${dropped.length} dropped, ${skipped.length} not news, ${unread.length} unread → ${WORK}/review.md`);
