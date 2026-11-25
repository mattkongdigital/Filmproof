// industry-news/test.js — `node industry-news/test.js`
// The round-up rules, checked on made-up drafts without a network: what keeps
// a story, what flags it, and what the merged item looks like.

import assert from 'node:assert/strict';
import { validateStory, buildRoundup } from './roundup.js';
import { robotsAllows } from '../opportunities/lib.js';
import { ANTHROPIC_AGENTS } from './sources.config.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

const PAGE_A = 'Reveni Labs has launched the KUVO, an automated modular processing system for developing film at home, with tanks that can be added as you need them.';
const cands = [
  { id: 'a1', source: 'src-a', item_url: 'https://a.example/kuvo/?utm_source=rss', title: 'NEWS: Reveni Labs launches KUVO', published: '2026-11-24' },
  { id: 'b1', source: 'src-b', item_url: 'https://b.example/kuvo-launch', title: 'KUVO is here', published: '2026-11-25' },
  { id: 'c1', source: 'src-a', item_url: 'https://a.example/five-frames', title: '5 Frames with a Kiev', published: '2026-11-25' },
];
const pages = new Map([
  ['a1', { url: 'https://a.example/kuvo/', text: PAGE_A }],
  ['b1', { url: 'https://b.example/kuvo-launch', text: 'A home film processor called KUVO is now on sale.' }],
  ['c1', { url: 'https://a.example/five-frames', text: 'Five frames.' }],
]);
const sourceNames = { 'src-a': 'Site A', 'src-b': 'Site B' };
const lookup = new Map(cands.map((c) => [c.id, { candidate: c, page: pages.get(c.id), sourceName: sourceNames[c.source] }]));
const good = {
  candidates: ['a1', 'b1'],
  headline: 'Reveni Labs releases KUVO, a home processor for film',
  summary: 'The Swedish maker behind the Reveni spot meter now sells a modular machine that develops film at home, built up one tank at a time.',
  category: 'labs',
};

test('a story links only to the pages that were fetched, one link per source', () => {
  const { story, review } = validateStory(good, lookup);
  assert.deepEqual(review, []);
  assert.deepEqual(story.links, [{ name: 'Site A', url: 'https://a.example/kuvo/' }, { name: 'Site B', url: 'https://b.example/kuvo-launch' }]);
  assert.equal(story.published, '2026-11-25');
  assert.equal(story.category, 'labs');
  // A URL in the draft is ignored: links come from the candidates.
  const { story: s2 } = validateStory({ ...good, url: 'https://made-up.example/' }, lookup);
  assert.ok(!JSON.stringify(s2).includes('made-up'));
});

test('a story is dropped without a candidate, a headline or a summary', () => {
  assert.match(validateStory({ ...good, candidates: [] }, lookup).dropped, /no candidate/);
  assert.match(validateStory({ ...good, candidates: ['zz'] }, lookup).dropped, /unknown candidate zz/);
  assert.match(validateStory({ ...good, headline: ' ' }, lookup).dropped, /no headline/);
  assert.match(validateStory({ ...good, summary: '' }, lookup).dropped, /no summary/);
});

test('copied text, dashes, overlong copy and a bad category are flagged, not fixed', () => {
  const { story, review } = validateStory({
    ...good,
    summary: 'Reveni Labs has launched the KUVO, an automated modular processing system for developing film at home.',
    headline: 'KUVO — a new processor',
    category: 'gadgets',
  }, lookup);
  assert.ok(review.some((r) => /summary shares "/.test(r)));
  assert.ok(review.some((r) => /headline uses a dash/.test(r)));
  assert.ok(review.some((r) => /category "gadgets"/.test(r)));
  assert.equal(story.category, 'industry');
  assert.ok(validateStory({ ...good, headline: 'x'.repeat(101) }, lookup).review.some((r) => /101 characters/.test(r)));
  // A hyphenated word is not a dash.
  assert.deepEqual(validateStory({ ...good, headline: 'Half-frame KUVO launch' }, lookup).review, []);
});

const draft = { intro: 'A week led by home processing.', stories: [good], skipped: [{ candidate: 'c1', reason: 'gallery post' }] };
const NOW = new Date('2026-11-27T08:30:00Z');

test('the merge builds one held round-up item for the ISO week', () => {
  const r = buildRoundup({ draft, candidates: cands, pages, sourceNames, content: [], today: '2026-11-27', now: NOW });
  assert.equal(r.content.length, 1);
  const it = r.item;
  assert.equal(it.id, 'industry-news:2026-w48');
  assert.equal(it.type, 'industry-news');
  assert.equal(it.kind, 'roundup');
  assert.equal(it.date, '2026-11-27');
  assert.equal(it.publish, false);
  assert.equal(it.summary, 'A week led by home processing.');
  assert.equal(it.children.length, 1);
  assert.deepEqual([...r.read].sort(), ['a1', 'b1', 'c1']);
  assert.equal(r.unread.length, 0);
});

test('a candidate in neither stories nor skipped is unread; no stories means no item', () => {
  const r = buildRoundup({ draft: { intro: '', stories: [], skipped: [] }, candidates: cands, pages, sourceNames, content: [], today: '2026-11-27', now: NOW });
  assert.equal(r.item, null);
  assert.equal(r.content.length, 0);
  assert.equal(r.unread.length, 3);
});

test('a story already in an earlier round-up is dropped; a re-run in the same week adds to the held item', () => {
  const first = buildRoundup({ draft, candidates: cands, pages, sourceNames, content: [], today: '2026-11-27', now: NOW });
  const nextWeek = buildRoundup({ draft, candidates: cands, pages, sourceNames, content: first.content, today: '2026-12-04', now: NOW });
  assert.equal(nextWeek.item, null);
  assert.match(nextWeek.dropped[0].reason, /earlier round-up/);
  const extra = { candidates: ['c1'], headline: 'Kiev cameras return', summary: 'A short note on old Soviet rangefinders coming back into shops.', category: 'cameras' };
  const sameWeek = buildRoundup({ draft: { intro: 'Other words.', stories: [extra], skipped: [] }, candidates: cands, pages, sourceNames, content: first.content, today: '2026-11-28', now: NOW });
  assert.equal(sameWeek.item.children.length, 2);
  assert.equal(sameWeek.item.summary, 'A week led by home processing.', 'the first intro stays');
  assert.equal(sameWeek.item.date, '2026-11-27');
  assert.deepEqual(sameWeek.item.children.map((s) => s.category), ['cameras', 'labs'], 'sorted by category order');
});

test('a published round-up is never changed by a later run that week', () => {
  const first = buildRoundup({ draft, candidates: cands, pages, sourceNames, content: [], today: '2026-11-27', now: NOW });
  const published = first.content.map((it) => ({ ...it, publish: true }));
  assert.throws(() => buildRoundup({ draft, candidates: cands, pages, sourceNames, content: published, today: '2026-11-28', now: NOW }), /already published/);
});

test('a malformed draft is refused', () => {
  assert.throws(() => buildRoundup({ draft: [], candidates: cands, pages, sourceNames, content: [], today: '2026-11-27' }), /must be/);
});

test('robots.txt refusing an Anthropic agent is caught even when FilmproofBot is allowed', () => {
  const txt = 'User-agent: *\nAllow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n';
  assert.equal(robotsAllows(txt, '/feed/'), true);
  assert.deepEqual(ANTHROPIC_AGENTS.filter((a) => !robotsAllows(txt, '/feed/', a)), ['anthropic-ai']);
  assert.deepEqual(ANTHROPIC_AGENTS.filter((a) => !robotsAllows('User-agent: *\nDisallow: /wp-admin/\n', '/feed/', a)), []);
});

console.log(`\n${n} passed`);
