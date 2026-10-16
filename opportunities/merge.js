// opportunities/merge.js
// Step 3 of a run (see opportunities/RUNBOOK.md). Checks every extraction
// against the pages it was read from, dedupes by official URL, and writes the
// results into the files the review PR carries:
//
//   web/content/opportunities.json   new entries added, existing ones untouched
//                                    apart from gaining a source
//   opportunities/seen.json          every item that was read, so it never is again
//   opportunities/work/review.md     the PR body: what was added, flagged, dropped
//
//   node opportunities/merge.js
//
// Exits non-zero, writing nothing, if extractions.json is malformed or names a
// candidate that doesn't exist — a half-merged run is worse than none.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { OPPORTUNITY_SOURCES } from './sources.config.js';
import { normaliseUrl } from './lib.js';
import { validateEntry, entryFlags } from './validate.js';
import { WORK, SEEN_PATH, CONTENT_PATH, loadPage } from './paths.js';

const VERDICTS = ['opportunity', 'not-an-opportunity', 'not-for-film-photographers', 'closed'];

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);
const fail = (msg) => { console.error(`merge: ${msg}`); process.exit(1); };

const candidates = readJson(`${WORK}/candidates.json`, null) || fail('no work/candidates.json — run fetch.js first');
const extractions = readJson(`${WORK}/extractions.json`, null) || fail('no work/extractions.json — nothing was extracted');
const sourcesRun = readJson(`${WORK}/sources.json`, { today: new Date().toISOString().slice(0, 10), sources: [], tooOld: [] });
const seen = readJson(SEEN_PATH, {});
const content = readJson(CONTENT_PATH, []);
const today = sourcesRun.today;

if (!Array.isArray(extractions)) fail('extractions.json must be an array');
const byId = new Map(candidates.map((c) => [c.id, c]));
for (const [i, x] of extractions.entries()) {
  if (!byId.has(x.candidate)) fail(`extraction ${i} names unknown candidate "${x.candidate}"`);
  if (!VERDICTS.includes(x.verdict)) fail(`extraction ${i} has verdict "${x.verdict}", expected one of ${VERDICTS.join(', ')}`);
  if (x.verdict === 'opportunity' && !x.entry) fail(`extraction ${i} is an opportunity with no entry`);
}

const sourceName = Object.fromEntries(OPPORTUNITY_SOURCES.map((s) => [s.id, s.name]));
const existing = new Map(content.map((e) => [e.key, e]));
const added = [];      // { entry, review }
const alsoSeen = [];   // { entry, source }
const dropped = [];    // { candidate, title, reason }
const passed = [];     // { candidate, verdict, reason }

for (const x of extractions) {
  const cand = byId.get(x.candidate);
  if (x.verdict !== 'opportunity') {
    passed.push({ candidate: cand, verdict: x.verdict, reason: x.reason || '' });
    continue;
  }

  // The candidate's own page, plus the official page when one was fetched.
  const pages = [loadPage(cand.id)];
  if (x.official_page) {
    const p = loadPage(x.official_page);
    if (!p) fail(`extraction for ${cand.id} names official_page "${x.official_page}", which was never fetched`);
    pages.push(p);
  }
  const { entry, review, dropped: why } = validateEntry(x.entry, pages.filter(Boolean));
  if (!entry) {
    dropped.push({ candidate: cand, title: x.entry?.title || cand.title, reason: why });
    continue;
  }

  const source = { id: cand.source, url: cand.item_url, found: today };
  const prior = existing.get(entry.key);
  if (prior) {
    // Already on file, from an earlier run or earlier in this one. Its fields
    // have been (or are about to be) reviewed, so they are left alone; the new
    // source is only recorded.
    if (!prior.sources.some((s) => s.id === source.id)) prior.sources.push(source);
    alsoSeen.push({ entry: prior, source });
    continue;
  }

  const flags = entryFlags(entry, review);
  const record = {
    ...entry,
    flags,
    // A flagged entry waits for a person; a clean one goes live on merge.
    publish: flags.length === 0,
    sources: [source],
  };
  existing.set(entry.key, record);
  added.push({ entry: record, review });
}

// Every candidate with an extraction has been read and is never sent again;
// so is everything fetch.js skipped for age. A candidate with no extraction
// was not read — it stays unseen and comes round next week.
const read = new Set(extractions.map((x) => x.candidate));
const unread = candidates.filter((c) => !read.has(c.id));
for (const c of candidates) if (read.has(c.id)) seen[normaliseUrl(c.item_url)] = today;
for (const key of sourcesRun.tooOld || []) seen[key] ??= today;

const sortedSeen = Object.fromEntries(Object.entries(seen).sort(([a], [b]) => a.localeCompare(b)));
const sortedContent = [...existing.values()].sort((a, b) => a.key.localeCompare(b.key));
writeFileSync(SEEN_PATH, JSON.stringify(sortedSeen, null, 2) + '\n');
writeFileSync(CONTENT_PATH, JSON.stringify(sortedContent, null, 2) + '\n');

// ---------------------------------------------------------------------------
// The review PR body

const cell = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const feeText = (fee) => fee.free === true ? 'Free'
  : fee.free === false ? [fee.amount != null ? `${fee.amount} ${fee.currency}` : null, fee.note].filter(Boolean).join(' — ')
  : '**unknown**';

const lines = [];
lines.push(`Weekly opportunities run, ${today}.`, '');
lines.push(`**${added.length} new** (${added.filter((a) => a.entry.publish).length} will go live on merge, ${added.filter((a) => !a.entry.publish).length} held for you), ${alsoSeen.length} already on file, ${passed.length} not listed, ${dropped.length} dropped.`, '');
lines.push('Nothing here is live until this PR merges. A held entry (`publish: false`) stays off the board until you set it to `true` — edit `web/content/opportunities.json` in this PR. To reject one, leave it held rather than deleting it: a deleted entry is found again next week.', '');

if (added.length) {
  lines.push('## New entries', '');
  lines.push('| | Title | Type | Deadline | Fee | Flags |', '|---|---|---|---|---|---|');
  for (const { entry } of added) {
    lines.push(`| ${entry.publish ? '✅ live' : '⏸ held'} | [${cell(entry.title)}](${entry.official_url}) — ${cell(entry.organiser)} | ${entry.type} | ${entry.deadline || '**unknown**'} | ${cell(feeText(entry.fee))} | ${entry.flags.map((f) => '`' + f + '`').join(' ') || '—'} |`);
  }
  lines.push('');
  for (const { entry, review } of added) {
    lines.push(`<details><summary>${cell(entry.title)}</summary>`, '');
    lines.push(`- **Summary:** ${entry.summary || '—'}`);
    lines.push(`- **Eligibility:** ${entry.eligibility || '—'} (${entry.region || 'region unknown'}, ${entry.film || 'film fit unknown'})`);
    lines.push(`- **Rights:** ${entry.rights.summary || 'not stated'}${entry.rights.flags.length ? ` — flagged ${entry.rights.flags.join(', ')}` : ''}`);
    for (const [k, v] of Object.entries(entry.evidence)) if (v) lines.push(`- **${k} quote:** “${v}”`);
    if (review.length) lines.push(`- **Left for you:** ${review.join('; ')}`);
    lines.push(`- **Found via:** ${sourceName[entry.sources[0].id]} — ${entry.sources[0].url}`, '', '</details>', '');
  }
}

if (alsoSeen.length) {
  lines.push('## Already on file', '');
  for (const { entry, source } of alsoSeen) lines.push(`- ${entry.title} — also listed by ${sourceName[source.id]}`);
  lines.push('');
}

if (dropped.length) {
  lines.push('## Dropped — failed validation', '', 'Read as an opportunity, but could not be listed. Add by hand if it is real.', '');
  for (const d of dropped) lines.push(`- [${cell(d.title)}](${d.candidate.item_url}) — ${d.reason}`);
  lines.push('');
}

if (passed.length) {
  lines.push('<details><summary>Not listed (' + passed.length + ')</summary>', '');
  for (const p of passed) lines.push(`- [${cell(p.candidate.title)}](${p.candidate.item_url}) — ${p.verdict}${p.reason ? `: ${p.reason}` : ''}`);
  lines.push('', '</details>', '');
}

lines.push('## Sources', '');
for (const s of sourcesRun.sources) {
  lines.push(s.ok
    ? `- ${s.name}: ${s.inFeed} in feed, ${s.fresh} new, ${s.skippedSeen} seen, ${s.skippedFilter} filtered out, ${s.skippedOld} too old`
    : `- ⚠️ ${s.name}: **no working feed** — ${s.errors.join('; ')}`);
}
if (unread.length) lines.push('', `⚠️ ${unread.length} candidate(s) were not read this run and will come round again next week.`);

writeFileSync(`${WORK}/review.md`, lines.join('\n') + '\n');
console.log(`${added.length} added, ${alsoSeen.length} already on file, ${dropped.length} dropped, ${passed.length} not listed, ${unread.length} unread → ${WORK}/review.md`);
