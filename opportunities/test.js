// opportunities/test.js — `node opportunities/test.js`
// The deterministic rules, checked without a network: URL keys, feed parsing,
// robots.txt, and the validation that stands between an extraction and the board.

import assert from 'node:assert/strict';
import { normaliseUrl, parseFeed, htmlToText, extractLinks, robotsAllows } from './lib.js';
import { validateEntry, entryFlags, copiedRun } from './validate.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

test('normaliseUrl folds scheme, www, trailing slash, tracking and param order', () => {
  const k = 'example.org/calls/open-2026?b=2&id=7';
  assert.equal(normaliseUrl('https://www.Example.org/calls/open-2026/?utm_source=x&id=7&b=2#apply'), k);
  assert.equal(normaliseUrl('http://example.org/calls/open-2026?id=7&b=2&fbclid=abc'), k);
  assert.equal(normaliseUrl('https://example.org/calls/index.html'), 'example.org/calls');
  assert.equal(normaliseUrl('mailto:someone@example.org'), null);
  assert.equal(normaliseUrl('not a url'), null);
});

test('parseFeed reads RSS items with CDATA and content:encoded', () => {
  const xml = `<rss><channel><title>Site</title>
    <item><title><![CDATA[Open call: Night &amp; Day]]></title><link>https://example.org/night/</link>
      <pubDate>Mon, 12 Oct 2026 09:00:00 +0000</pubDate>
      <description>short</description>
      <content:encoded><![CDATA[<p>Full <a href="/apply">body</a></p>]]></content:encoded></item>
    <item><title>Second</title><link>https://example.org/two/</link><description>two</description></item>
  </channel></rss>`;
  const items = parseFeed(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Open call: Night & Day');
  assert.equal(items[0].url, 'https://example.org/night/');
  assert.match(items[0].html, /Full/);
  assert.equal(items[1].html, 'two');
});

test('parseFeed reads Atom entries', () => {
  const xml = `<feed><entry><title>A</title><link rel="alternate" href="https://example.org/a"/><updated>2026-10-01</updated><summary>s</summary></entry></feed>`;
  assert.deepEqual(parseFeed(xml).map((i) => i.url), ['https://example.org/a']);
});

test('htmlToText drops scripts and nav, keeps block breaks, decodes entities', () => {
  const t = htmlToText('<nav>Menu</nav><h1>Title</h1><p>Fee: &pound;15&nbsp;per entry</p><script>x()</script>');
  assert.equal(t, 'Title\nFee: £15 per entry');
});

test('extractLinks resolves relative links and dedupes', () => {
  const links = extractLinks('<a href="/apply">Apply</a> <a href="/apply">again</a> <a href="mailto:x@y.z">m</a>', 'https://example.org/call/');
  assert.deepEqual(links, [{ href: 'https://example.org/apply', text: 'Apply' }]);
});

test('robotsAllows: longest rule wins, named group replaces *', () => {
  const txt = 'User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nDisallow: /*?s=\n\nUser-agent: BadBot\nDisallow: /';
  assert.equal(robotsAllows(txt, '/feed/'), true);
  assert.equal(robotsAllows(txt, '/wp-admin/x'), false);
  assert.equal(robotsAllows(txt, '/wp-admin/admin-ajax.php'), true);
  assert.equal(robotsAllows(txt, '/?s=film'), false);
  assert.equal(robotsAllows('User-agent: FilmproofBot\nDisallow: /\n\nUser-agent: *\nAllow: /', '/feed/'), false);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /calls$', '/calls/x'), true);
  assert.equal(robotsAllows('', '/anything'), true);
});

// A page as fetch.js saves it, and an extraction that matches it.
const page = {
  url: 'https://gallery.example/open-call-2026/',
  text: 'Open Call 2026\nThe deadline for entries is 30 November 2026.\nEntry costs £12 per image.\n'
    + 'By entering you grant the gallery a non-exclusive, perpetual licence to reproduce all entries.',
  links: [{ href: 'https://gallery.example/apply', text: 'Apply' }],
};
const good = () => ({
  title: 'Open Call 2026', organiser: 'Example Gallery', type: 'open-call',
  official_url: 'https://gallery.example/open-call-2026/',
  deadline: '2026-11-30', fee: { free: false, amount: 12, currency: 'GBP', note: 'per image' },
  eligibility: 'Anyone', region: 'worldwide', film: 'film-friendly',
  rights: { summary: 'Perpetual licence over every entry.', flags: ['perpetual', 'all-entrants'] },
  summary: 'An annual gallery show taking single images on any theme, judged by the gallery team.',
  evidence: {
    deadline: 'The deadline for entries is 30 November 2026',
    fee: 'Entry costs £12 per image',
    rights: 'non-exclusive, perpetual licence to reproduce all entries',
  },
});

test('validateEntry keeps a fully evidenced entry and flags fee and rights', () => {
  const { entry, review, dropped } = validateEntry(good(), [page]);
  assert.equal(dropped, null);
  assert.deepEqual(review, []);
  assert.equal(entry.key, 'gallery.example/open-call-2026');
  assert.equal(entry.deadline, '2026-11-30');
  assert.deepEqual(entryFlags(entry, review), ['fee', 'rights:perpetual', 'rights:all-entrants']);
});

test('validateEntry empties a deadline whose quote is not on the page', () => {
  const x = good();
  x.deadline = '2026-12-01';
  x.evidence.deadline = 'Closes 1 December 2026';
  const { entry, review } = validateEntry(x, [page]);
  assert.equal(entry.deadline, null);
  assert.equal(entry.evidence.deadline, null);
  assert.ok(entryFlags(entry, review).includes('needs-review:deadline'));
});

test('validateEntry rejects an impossible date rather than repairing it', () => {
  const x = good();
  x.deadline = '2026-11-31';
  assert.equal(validateEntry(x, [page]).entry.deadline, null);
});

test('validateEntry treats a missing fee as unknown, never free', () => {
  const x = good();
  delete x.fee;
  const { entry, review } = validateEntry(x, [page]);
  assert.deepEqual(entry.fee, { free: null, amount: null, currency: null, note: null });
  assert.ok(entryFlags(entry, review).includes('needs-review:fee'));
});

test('validateEntry drops an official URL that appears on no fetched page', () => {
  const x = good();
  x.official_url = 'https://gallery.example/somewhere-else/';
  const { entry, dropped } = validateEntry(x, [page]);
  assert.equal(entry, null);
  assert.match(dropped, /not a fetched page/);
});

test('validateEntry accepts an official URL that is a link on the page', () => {
  const x = good();
  x.official_url = 'https://gallery.example/apply?utm_source=feed';
  assert.equal(validateEntry(x, [page]).entry.key, 'gallery.example/apply');
});

test('validateEntry keeps rights flags without a quote, but sends them to review', () => {
  const x = good();
  x.evidence.rights = 'something the page never says';
  const { entry, review } = validateEntry(x, [page]);
  assert.deepEqual(entry.rights.flags, ['perpetual', 'all-entrants']);
  assert.equal(entry.rights.summary, null);
  assert.ok(entryFlags(entry, review).includes('needs-review:rights'));
});

test('copiedRun catches a summary lifted from the source', () => {
  assert.equal(copiedRun('Short.', [page.text]), null);
  assert.ok(copiedRun('By entering you grant the gallery a non-exclusive, perpetual licence to reproduce.', [page.text]));
  const x = good();
  x.summary = 'By entering you grant the gallery a non-exclusive, perpetual licence to reproduce all entries.';
  const { entry, review } = validateEntry(x, [page]);
  assert.ok(entryFlags(entry, review).includes('needs-review:summary'));
});

test('a clean free entry carries no flags', () => {
  const p = { url: 'https://free.example/call', text: 'Free to enter. Closes 1 March 2027.', links: [] };
  const { entry, review } = validateEntry({
    title: 'Free call', organiser: 'Free Org', type: 'competition', official_url: p.url,
    deadline: '2027-03-01', fee: { free: true }, region: 'uk', film: 'film-specific',
    summary: 'A free competition for photographs made on film, open to UK residents.',
    evidence: { deadline: 'Closes 1 March 2027', fee: 'Free to enter' },
  }, [p]);
  assert.deepEqual(entryFlags(entry, review), []);
});

console.log(`\n${n} passed`);
