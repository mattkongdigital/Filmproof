// src/news/test.js — `node src/news/test.js`
// The shop-update rules, checked on small made-up catalogues without a network:
// what counts as a change, what is promoted to its own item, and the guards.

import assert from 'node:assert/strict';
import { diffCatalogue, mergeIntoLog, retailerSlug, THRESHOLDS } from './shop-updates.js';
import { isoWeek, weekRange, ukDay, rollupTitle } from '../../web/lib/news-format.mjs';
import { mergeShopNews, postId } from './shop-news.js';
import { parseFeed } from '../../opportunities/lib.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

const day = (d) => new Date(`${d}T06:00:00Z`);
const offer = (retailer, price, inStock = true, extra = {}) => ({ retailer, price, inStock, url: `https://${retailerSlug(retailer)}.example/${price}`, ...extra });
const film = (key, offers, extra = {}) => ({ key, slug: `${key}-film`, display: `Film ${key}`, brand: 'x', format: '135', offers, ...extra });

// Thirty filler films at each shop, so a handful of changes is plausible.
const filler = (shops) => Array.from({ length: 30 }, (_, i) => film(`fill${i}`, shops.map((s) => offer(s, 10))));
const SHOPS = ['Shop A', 'Shop B'];
const base = (films) => [...filler(SHOPS), ...films];

// Runs builds in sequence, each against the previous one's snapshot.
function seq(builds, opts = {}) {
  let prev = null;
  return builds.map(([d, site]) => {
    const r = diffCatalogue({ prev, site, now: day(d), ...opts });
    prev = r.state;
    return r;
  });
}

test('first run seeds the snapshot and posts nothing', () => {
  const [r] = seq([['2026-11-20', base([film('a', [offer('Shop A', 10)])])]]);
  assert.equal(r.firstRun, true);
  assert.equal(r.items.length, 0);
  assert.equal(r.state.offers['a|Shop A'].inStock, true);
  assert.equal(r.state.films.a.slug, 'a-film');
});

test('an unchanged catalogue posts nothing', () => {
  const s = base([film('a', [offer('Shop A', 10)])]);
  const [, r] = seq([['2026-11-20', s], ['2026-11-21', s]]);
  assert.equal(r.items.length, 0);
});

test('a known film newly listed at another shop goes in that shop\'s roll-up', () => {
  const [, r] = seq([
    ['2026-11-20', base([film('a', [offer('Shop A', 10)])])],
    ['2026-11-21', base([film('a', [offer('Shop A', 10), offer('Shop B', 11)])])],
  ]);
  assert.equal(r.items.length, 1);
  const [it] = r.items;
  assert.equal(it.kind, 'rollup');
  assert.equal(it.id, 'shop-update:2026-11-21:rollup:shop-b');
  assert.equal(it.title, 'Shop B: 1 newly listed');
  assert.deepEqual(it.children.map((c) => [c.change, c.film.slug, c.price]), [['new', 'a-film', 11]]);
  assert.match(it.children[0].offerUrl, /^https:\/\/shop-b/);
});

test('a listing that arrives out of stock is not news; its restock later is', () => {
  const [, r1, r2] = seq([
    ['2026-11-20', base([film('a', [offer('Shop A', 10)])])],
    ['2026-11-21', base([film('a', [offer('Shop A', 10), offer('Shop B', 11, false)])])],
    ['2026-11-22', base([film('a', [offer('Shop A', 10), offer('Shop B', 11)])])],
  ]);
  assert.equal(r1.items.length, 0);
  assert.deepEqual(r2.items.map((i) => [i.kind, i.children[0].change]), [['rollup', 'restock']]);
});

test('a film new to the whole catalogue gets its own item, not a roll-up line', () => {
  const [, r] = seq([
    ['2026-11-20', base([])],
    ['2026-11-21', base([film('z', [offer('Shop A', 9), offer('Shop B', 9.5)]), film('fill0', [offer('Shop A', 10), offer('Shop B', 10)])])],
  ]);
  const nf = r.items.filter((i) => i.kind === 'new-film');
  assert.equal(nf.length, 1);
  assert.equal(nf[0].title, 'New to Filmproof: Film z');
  assert.equal(nf[0].children.length, 2);
  assert.equal(nf[0].source.kind, 'catalogue');
  assert.equal(r.items.filter((i) => i.kind === 'rollup').length, 0);
});

test('back after being out everywhere for 3+ days is promoted; under 3 days is routine', () => {
  const out = base([film('a', [offer('Shop A', 10, false), offer('Shop B', 10, false)])]);
  const back = base([film('a', [offer('Shop A', 10), offer('Shop B', 10, false)])]);
  const inn = base([film('a', [offer('Shop A', 10), offer('Shop B', 10)])]);
  const long = seq([['2026-11-01', inn], ['2026-11-02', out], ['2026-11-05', back]]);
  const it = long[2].items.find((i) => i.kind === 'back-everywhere');
  assert.ok(it, 'promoted');
  assert.equal(it.outDays, 3);
  assert.equal(it.title, 'Back in stock: Film a');
  assert.equal(long[2].items.filter((i) => i.kind === 'rollup').length, 0);
  const short = seq([['2026-11-01', inn], ['2026-11-02', out], ['2026-11-04', back]]);
  assert.deepEqual(short[2].items.map((i) => i.kind), ['rollup']);
});

test('back at one shop after 60+ days is promoted even while others had it', () => {
  const inn = base([film('a', [offer('Shop A', 10), offer('Shop B', 10)])]);
  const outB = base([film('a', [offer('Shop A', 10), offer('Shop B', 10, false)])]);
  const r = seq([['2026-08-01', inn], ['2026-08-02', outB], ['2026-10-01', inn]])[2];
  assert.deepEqual(r.items.map((i) => i.kind), ['back-at-shop']);
  assert.equal(r.items[0].outDays, 60);
  assert.equal(r.items[0].id, 'shop-update:2026-10-01:back-at-shop:a-film:shop-b');
  const r2 = seq([['2026-08-01', inn], ['2026-08-02', outB], ['2026-09-30', inn]])[2];
  assert.deepEqual(r2.items.map((i) => i.kind), ['rollup']);
});

test('price drops: single-item offers only, real drops only, never rises', () => {
  const s = (a, packPrice = 40) => base([film('a', [offer('Shop A', a), offer('Shop A', packPrice, true, { packSize: 5 })])]);
  const drop = seq([['2026-11-20', s(10)], ['2026-11-21', s(9)]])[1];
  assert.deepEqual(drop.items[0].children.map((c) => [c.change, c.price, c.was]), [['price-drop', 9, 10]]);
  assert.equal(seq([['2026-11-20', s(10)], ['2026-11-21', s(11)]])[1].items.length, 0, 'rise ignored');
  assert.equal(seq([['2026-11-20', s(10)], ['2026-11-21', s(9.8)]])[1].items.length, 0, 'under £0.25 ignored');
  assert.equal(seq([['2026-11-20', s(100)], ['2026-11-21', s(98)]])[1].items.length, 0, 'under 3% ignored');
  assert.equal(seq([['2026-11-20', s(10, 40)], ['2026-11-21', s(10, 30)]])[1].items.length, 0, 'multipack ignored');
  // Only a pack in stock: no single price, so nothing to compare.
  const packOnly = (p) => base([film('a', [offer('Shop A', 10, false), offer('Shop A', p, true, { packSize: 5 })])]);
  assert.equal(seq([['2026-11-20', packOnly(40)], ['2026-11-21', packOnly(30)]])[1].items.length, 0);
});

test('a renamed key keeps its history: same slug, or a LEGACY_FILM_SLUGS retirement', () => {
  const a = base([film('old', [offer('Shop A', 10)], { slug: 'kodak-gold' })]);
  const sameSlug = base([film('new', [offer('Shop A', 10)], { slug: 'kodak-gold' })]);
  const r = seq([['2026-11-20', a], ['2026-11-21', sameSlug]])[1];
  assert.equal(r.items.length, 0);
  assert.ok(r.state.films.new && !r.state.films.old);
  assert.equal(r.state.offers['new|Shop A'].firstSeen, '2026-11-20');
  const moved = base([film('new', [offer('Shop A', 10)], { slug: 'kodak-eastman-gold' })]);
  const r2 = seq([['2026-11-20', a], ['2026-11-21', moved]], { legacy: { 'kodak-gold': 'kodak-eastman-gold' } })[1];
  assert.equal(r2.items.length, 0);
  const r3 = seq([['2026-11-20', a], ['2026-11-21', moved]])[1];
  assert.equal(r3.items[0].kind, 'new-film', 'without the legacy entry it would read as new');
});

test('a newly onboarded shop seeds silently', () => {
  const before = base([film('a', [offer('Shop A', 10)])]);
  const after = [...before.map((f) => ({ ...f, offers: [...f.offers, offer('Shop C', 8)] })), film('c-only', [offer('Shop C', 7)])];
  const r = seq([['2026-11-20', before], ['2026-11-21', after]])[1];
  assert.equal(r.items.length, 0);
  assert.ok(r.log.some((l) => /Shop C: seeded/.test(l)));
  assert.ok(r.state.retailers['Shop C']);
});

test('an implausibly large diff is skipped with a warning, then re-seeded after 3 runs', () => {
  const inn = base([]);
  const broken = inn.map((f) => ({ ...f, offers: f.offers.map((o) => (o.retailer === 'Shop A' ? { ...o, inStock: false } : o)) }));
  const runs = seq([['2026-11-20', inn], ['2026-11-21', broken], ['2026-11-22', broken], ['2026-11-23', broken], ['2026-11-24', inn]]);
  assert.equal(runs[1].items.length, 0);
  assert.ok(runs[1].log.some((l) => /^WARNING Shop A: 30 changes/.test(l)));
  assert.equal(runs[1].state.offers['fill0|Shop A'].inStock, true, 'rows kept on a skip');
  assert.equal(runs[1].state.films.fill0.outEverywhereSince, null);
  assert.equal(runs[3].state.offers['fill0|Shop A'].inStock, false, 'third skip re-seeds');
  assert.ok(runs[3].log.some((l) => /new normal/.test(l)));
  // The return to normal is itself 30 changes, so it too is a skip, not 30 restocks.
  assert.equal(runs[4].items.length, 0);
});

test('FILMPROOF_NEWS_ACCEPT takes an implausible diff silently, this once', () => {
  const inn = base([]);
  const broken = inn.map((f) => ({ ...f, offers: f.offers.map((o) => (o.retailer === 'Shop A' ? { ...o, inStock: false } : o)) }));
  const [, r] = seq([['2026-11-20', inn], ['2026-11-21', broken]], { accept: new Set(['Shop A']) });
  assert.equal(r.items.length, 0);
  assert.equal(r.state.offers['fill0|Shop A'].inStock, false);
});

test('a listing that leaves the feed is unlisted, and coming back is a restock', () => {
  const both = base([film('a', [offer('Shop A', 10), offer('Shop B', 10)])]);
  const gone = base([film('a', [offer('Shop A', 10)])]);
  const runs = seq([['2026-11-20', both], ['2026-11-21', gone], ['2026-11-22', both]]);
  assert.equal(runs[1].state.offers['a|Shop B'].listed, false);
  assert.equal(runs[1].state.offers['a|Shop B'].lastPrice, 10);
  assert.deepEqual(runs[2].items[0].children.map((c) => c.change), ['restock']);
});

test('a film every shop has dropped stays in the snapshot for a tombstone page', () => {
  const r = seq([['2026-11-20', base([film('a', [offer('Shop A', 12)])])], ['2026-11-21', base([])]])[1];
  assert.equal(r.state.films.a.lastListed, '2026-11-21');
  assert.equal(r.state.films.a.outEverywhereSince, '2026-11-21');
  assert.equal(r.state.offers['a|Shop A'].lastPrice, 12);
});

test('changes are dated by the UK day of this build, since the stored previous build', () => {
  // 23:30 UTC in summer is the next day in the UK.
  const prev = diffCatalogue({ prev: null, site: base([film('a', [offer('Shop A', 10)])]), now: new Date('2026-07-01T06:00:00Z') }).state;
  const r = diffCatalogue({ prev, site: base([film('a', [offer('Shop A', 10), offer('Shop B', 10)])]), now: new Date('2026-07-01T23:30:00Z') });
  assert.equal(r.items[0].date, '2026-07-02');
  assert.equal(r.state.previousBuiltAt, '2026-07-01T06:00:00.000Z');
});

test('a second build on the same day merges into the same item', () => {
  const runs = seq([
    ['2026-11-20', base([film('a', [offer('Shop A', 10)]), film('b', [offer('Shop A', 10)])])],
    ['2026-11-21', base([film('a', [offer('Shop A', 10), offer('Shop B', 10)]), film('b', [offer('Shop A', 10)])])],
    ['2026-11-21', base([film('a', [offer('Shop A', 10), offer('Shop B', 10)]), film('b', [offer('Shop A', 10), offer('Shop B', 10)])])],
  ]);
  const log = mergeIntoLog(mergeIntoLog([], runs[1].items), runs[2].items);
  assert.equal(log.length, 1);
  assert.equal(log[0].children.length, 2);
  assert.equal(log[0].title, 'Shop B: 2 newly listed');
});

test('ISO weeks, UK days and wording', () => {
  assert.equal(isoWeek('2026-11-25'), '2026-w48');
  assert.equal(isoWeek('2026-12-31'), '2026-w53');
  assert.equal(isoWeek('2027-01-01'), '2026-w53');
  assert.equal(isoWeek('2027-01-04'), '2027-w01');
  assert.deepEqual(weekRange('2026-w48'), { start: '2026-11-23', end: '2026-11-29' });
  assert.deepEqual(weekRange('2026-w53'), { start: '2026-12-28', end: '2027-01-03' });
  assert.equal(ukDay(new Date('2026-03-29T23:30:00Z')), '2026-03-30');
  assert.equal(retailerSlug('Bass & Bligh'), 'bass-and-bligh');
  assert.equal(rollupTitle('X', [{ change: 'restock' }, { change: 'new' }, { change: 'price-drop' }, { change: 'price-drop' }]), 'X: 1 newly listed, 1 back in stock, 2 lower prices');
  assert.equal(THRESHOLDS.retailerGapDays, 60);
});

// --- Shop news ---------------------------------------------------------------

const post = (title, url, published, html = '') => ({ title, url, published, html });
const NOW = new Date('2026-11-25T06:00:00Z');

test('shop news: recent posts are posted on the day the shop published them; old ones never', () => {
  const { log, added, skippedOld } = mergeShopNews({ now: NOW, fetched: [{ retailer: 'Shop A', entries: [
    post('New film in stock', 'https://shop-a.example/blogs/news/new-film', '2026-11-20T10:00:00+00:00'),
    post('Old guide', 'https://shop-a.example/blogs/news/old', '2026-10-28T10:00:00+00:00'),
    post('Edge of the window', 'https://shop-a.example/blogs/news/edge', '2026-10-29T10:00:00+00:00'),
  ] }] });
  assert.deepEqual(added.map((i) => [i.title, i.date]), [['New film in stock', '2026-11-20'], ['Edge of the window', '2026-10-29']]);
  assert.equal(skippedOld, 1);
  const [it] = log;
  assert.equal(it.id, 'shop-news:shop-a:shop-a.example/blogs/news/new-film');
  assert.equal(it.type, 'shop-news');
  assert.equal(it.kind, 'post');
  assert.equal(it.summary, null);
  assert.equal(it.url, 'https://shop-a.example/blogs/news/new-film');
  assert.deepEqual(it.source, { kind: 'retailer', name: 'Shop A' });
});

test('shop news: a post already on file keeps its date and first sighting, takes a new title', () => {
  const first = mergeShopNews({ now: NOW, fetched: [{ retailer: 'Shop A', entries: [post('Draft title', 'https://shop-a.example/p?utm_source=x', '2026-11-24')] }] });
  const later = mergeShopNews({ log: first.log, now: new Date('2026-11-26T06:00:00Z'), fetched: [{ retailer: 'Shop A', entries: [post('Final title', 'https://www.shop-a.example/p/', '2026-11-25')] }] });
  assert.equal(later.added.length, 0);
  assert.equal(later.log.length, 1);
  assert.equal(later.log[0].title, 'Final title');
  assert.equal(later.log[0].date, '2026-11-24');
  assert.equal(later.log[0].firstSeenAt, NOW.toISOString());
});

test('shop news: a failed feed drops nothing already on file', () => {
  const first = mergeShopNews({ now: NOW, fetched: [{ retailer: 'Shop A', entries: [post('A post', 'https://shop-a.example/a', '2026-11-24')] }] });
  const next = mergeShopNews({ log: first.log, now: NOW, fetched: [] });
  assert.equal(next.log.length, 1);
});

test('shop news: filmOnly keeps film posts and drops the rest; dates are UK days and never in the future', () => {
  const { added, skippedOffTopic } = mergeShopNews({ now: NOW, fetched: [{ retailer: 'Shop B', filmOnly: true, entries: [
    post('Buying a used spotting scope', 'https://b.example/scope', '2026-11-20', '<p>Check the prisms.</p>'),
    post('Our autumn guide', 'https://b.example/guide', '2026-11-20', '<p>Load a roll of 35mm and go.</p>'),
    post('Late night post', 'https://b.example/late', '2026-11-23T23:30:00Z'),
    post('Scheduled', 'https://b.example/future', '2026-12-25T09:00:00Z', 'film'),
    post('Undated', 'https://b.example/undated', '', 'film'),
  ] }] });
  assert.equal(skippedOffTopic, 2, 'scope post, and the late-night post with no film words');
  assert.deepEqual(added.map((i) => [i.title, i.date]), [['Our autumn guide', '2026-11-20'], ['Scheduled', '2026-11-25'], ['Undated', '2026-11-25']]);
  // 23:30 UTC in summer is the next UK day.
  const [summer] = mergeShopNews({ now: new Date('2026-07-05T06:00:00Z'), fetched: [{ retailer: 'S', entries: [post('x', 'https://s.example/x', '2026-07-01T23:30:00Z')] }] }).added;
  assert.equal(summer.date, '2026-07-02');
});

test('shop news: Shopify Atom and WordPress RSS feeds both parse', () => {
  const atom = parseFeed(`<feed><entry><id>1</id><published>2026-11-23T09:00:00+00:00</published>
    <link rel="alternate" type="text/html" href="https://shop.example/blogs/news/post"/>
    <title>What&apos;s new &amp; good</title><content type="html">&lt;p&gt;Film&lt;/p&gt;</content></entry></feed>`);
  assert.deepEqual([atom[0].title, atom[0].url, atom[0].published], ["What's new & good", 'https://shop.example/blogs/news/post', '2026-11-23T09:00:00+00:00']);
  const rss = parseFeed(`<rss><channel><item><title>Lucky 200 Film Review</title><link>https://wp.example/lucky/</link>
    <pubDate>Mon, 07 Sep 2026 16:49:05 +0000</pubDate><description>short</description></item></channel></rss>`);
  assert.equal(rss[0].url, 'https://wp.example/lucky/');
  assert.equal(postId('Bass & Bligh', 'https://www.bassandbligh.com/blogs/news/x/'), 'shop-news:bass-and-bligh:bassandbligh.com/blogs/news/x');
});

console.log(`\n${n} passed`);
