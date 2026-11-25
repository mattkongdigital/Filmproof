// industry-news/roundup.js
// The rules between a session's draft and the site. Pure: merge.js does the
// file reading and writing, and test.js checks these without a network.
//
// A draft is a claim. A story is kept only when every link it gives is a page
// this run actually fetched, so a URL can never be invented. Its headline and
// summary must be our own words: a run of eight words shared with the source
// page, or a dash (see House style in CLAUDE.md), is flagged for the reviewer
// rather than fixed. The round-up as a whole is always `publish: false`; a
// person sets it to true in the review PR.

import { normaliseUrl } from '../opportunities/lib.js';
import { copiedRun } from '../opportunities/validate.js';
import { isoWeek, STORY_CATEGORIES } from '../web/lib/news-format.mjs';

// How the round-up groups its stories on the page, in this order. The labels
// live in news-format.mjs, which the page reads too.
export const CATEGORIES = STORY_CATEGORIES;
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const LIMITS = { headline: 100, summary: 320, intro: 300 };

const DASH = /[–—]|\s-\s/;
const clean = (s) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : '');

// Our own copy: present, within its length, no dash, and not lifted from the
// pages it summarises. Returns the problems found, for the review PR.
function copyProblems(field, text, max, sourceTexts) {
  const out = [];
  if (text.length > max) out.push(`${field} is ${text.length} characters (limit ${max})`);
  if (DASH.test(text)) out.push(`${field} uses a dash; house style is commas`);
  const run = copiedRun(text, sourceTexts);
  if (run) out.push(`${field} shares "${run}" with the source`);
  return out;
}

// One drafted story.
//   raw      { candidates: [id, ...], headline, summary, category }
//   lookup   id -> { candidate, page, sourceName }
// Returns { story, review } or { dropped } with a reason.
export function validateStory(raw, lookup) {
  const ids = [raw?.candidates ?? []].flat();
  if (!ids.length) return { dropped: 'names no candidate' };
  const found = ids.map((id) => lookup.get(id));
  if (found.some((f) => !f)) return { dropped: `names unknown candidate ${ids.find((id) => !lookup.get(id))}` };
  if (found.some((f) => !f.page)) return { dropped: 'a candidate page was never fetched' };
  const headline = clean(raw.headline);
  const summary = clean(raw.summary);
  if (!headline) return { dropped: 'no headline' };
  if (!summary) return { dropped: 'no summary' };

  const texts = found.map((f) => f.page.text || '');
  const review = [
    ...copyProblems('headline', headline, LIMITS.headline, texts),
    ...copyProblems('summary', summary, LIMITS.summary, texts),
  ];
  let category = raw.category;
  if (!CATEGORY_IDS.includes(category)) {
    review.push(`category "${category ?? ''}" is not one of ${CATEGORY_IDS.join(', ')}; filed under industry`);
    category = 'industry';
  }
  // Each link is the URL that was fetched, never one the draft supplies.
  const links = found.map((f) => ({ name: f.sourceName, url: f.page.url || f.candidate.item_url }));
  const dates = found.map((f) => f.candidate.published).filter(Boolean).sort();
  return { story: { headline, summary, category, ...(dates.length ? { published: dates[dates.length - 1] } : {}), links }, review };
}

// Every story URL already in a round-up on file, so a story covered last week
// is not covered again because a second site wrote it up later.
function coveredUrls(content) {
  return new Set(content.flatMap((it) => (it.children || []).flatMap((s) => (s.links || []).map((l) => normaliseUrl(l.url)))));
}

// Fold a session's draft into the content file.
//   draft     { intro, stories: [...], skipped: [{ candidate, reason }] }
//   content   the current industry-news.json
// Returns { content, item, added, dropped, review, skipped, unread } or throws
// on a draft that can't be merged at all.
export function buildRoundup({ draft, candidates, pages, sourceNames, content, today, now = new Date() }) {
  if (!draft || typeof draft !== 'object' || !Array.isArray(draft.stories)) throw new Error('extractions.json must be { intro, stories: [...], skipped: [...] }');
  const lookup = new Map(candidates.map((c) => [c.id, { candidate: c, page: pages.get(c.id) || null, sourceName: sourceNames[c.source] || c.source }]));

  const id = `industry-news:${isoWeek(today)}`;
  const existing = content.find((it) => it.id === id);
  if (existing && existing.publish === true) {
    throw new Error(`${id} is already published; this week's round-up is closed, so run again next week`);
  }

  const covered = coveredUrls(content.filter((it) => it.id !== id));
  const added = [];
  const dropped = [];
  for (const raw of draft.stories) {
    const { story, review, dropped: why } = validateStory(raw, lookup);
    if (!story) { dropped.push({ raw, reason: why }); continue; }
    if (story.links.every((l) => covered.has(normaliseUrl(l.url)))) { dropped.push({ raw, reason: 'already in an earlier round-up' }); continue; }
    added.push({ story, review });
  }

  const intro = clean(draft.intro);
  const introReview = intro ? copyProblems('intro', intro, LIMITS.intro, []) : ['no intro written'];

  // Every candidate placed in a story or skipped with a reason has been read.
  // One the draft left out was not read: it stays unseen and comes round again.
  const read = new Set([
    ...draft.stories.flatMap((s) => [s?.candidates ?? []].flat()),
    ...(draft.skipped || []).map((s) => s.candidate),
  ]);
  const unread = candidates.filter((c) => !read.has(c.id));

  const order = (s) => CATEGORY_IDS.indexOf(s.category);
  const stories = [...(existing?.children || []), ...added.map((a) => a.story)].sort((a, b) => order(a) - order(b));

  let item = null;
  let next = content;
  if (stories.length) {
    item = {
      id,
      type: 'industry-news',
      kind: 'roundup',
      date: existing?.date || today,
      firstSeenAt: existing?.firstSeenAt || now.toISOString(),
      source: { kind: 'publication', name: 'Filmproof' },
      title: existing?.title || 'The week in film photography',
      summary: existing?.summary || intro || null,
      children: stories,
      // Always held: a person reads the round-up and publishes it.
      publish: false,
    };
    next = [...content.filter((it) => it.id !== id), item].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  }
  return { content: next, item, added, dropped, introReview, skipped: draft.skipped || [], unread, read };
}
