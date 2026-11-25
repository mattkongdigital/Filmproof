// lib/news-format.mjs — the news model's shared vocabulary: its types, its
// calendar (UK days, ISO weeks) and how a shop-update item is worded.
//
// Plain ESM with no imports, so it runs in three places: build-news.js (root,
// plain Node) when it writes items, the server pages that group them, and the
// client feed that filters them. See "News" in CLAUDE.md for the item model.

// Every kind of item the feed can carry, in filter-chip order. A type with no
// items in view gets no chip, so a type can be listed here before its
// pipeline exists. Adding a type: an entry here, a loader in lib/news.js.
export const NEWS_TYPES = [
  { id: 'shop-update', label: 'Shop updates', one: 'Shop update' },
  { id: 'shop-news', label: 'Shop news', one: 'Shop news' },
  { id: 'industry-news', label: 'Industry news', one: 'Industry news' },
];

// How long an item stays on /news/ itself. Everything stays on its week's
// archive page for good.
export const NEWS_WINDOW_DAYS = 28;

// The UK calendar day of an instant, as YYYY-MM-DD. Items are dated in UK
// time, so a 00:30 BST build is the day it is in the UK, not the day before.
export function ukDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(now);
}

const DAY_MS = 86400000;
const utc = (day) => Date.parse(day + 'T00:00:00Z');

export const addDays = (day, n) => new Date(utc(day) + n * DAY_MS).toISOString().slice(0, 10);

// Whole days from `a` to `b`, both YYYY-MM-DD.
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY_MS);

// The ISO week a day falls in, as the archive slug: 2026-11-25 -> 2026-w48.
// ISO weeks start on Monday, and week 1 is the one holding the year's first
// Thursday, so the last days of December can belong to next year's week 1.
export function isoWeek(day) {
  const d = new Date(utc(day));
  const thursday = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.ceil(((thursday - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7);
  return `${year}-w${String(week).padStart(2, '0')}`;
}

export const WEEK_SLUG = /^(\d{4})-w(\d{2})$/;

// Monday and Sunday of an archive week.
export function weekRange(slug) {
  const m = WEEK_SLUG.exec(slug);
  if (!m) return null;
  const jan4 = new Date(Date.UTC(Number(m[1]), 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS + (Number(m[2]) - 1) * 7 * DAY_MS);
  const start = monday.toISOString().slice(0, 10);
  return { start, end: addDays(start, 6) };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function displayDay(day, { weekday = false } = {}) {
  const [y, m, d] = day.split('-').map(Number);
  const wd = weekday ? `${WEEKDAYS[new Date(utc(day)).getUTCDay()]} ` : '';
  return `${wd}${d} ${MONTHS[m - 1]} ${y}`;
}

export function displayWeek(slug) {
  const r = weekRange(slug);
  return r ? `${displayDay(r.start)} to ${displayDay(r.end)}` : slug;
}

// --- Industry news ----------------------------------------------------------

// How a weekly round-up groups its stories, in this order. industry-news/
// roundup.js validates a draft's categories against these ids.
export const STORY_CATEGORIES = [
  { id: 'film-stocks', label: 'Film stocks and prices' },
  { id: 'cameras', label: 'Cameras and gear' },
  { id: 'labs', label: 'Labs and services' },
  { id: 'industry', label: 'The industry' },
  { id: 'community', label: 'Community' },
];

// --- Shop updates -----------------------------------------------------------

// The changes a shop-update child can record, in the order a roll-up lists them.
export const CHANGES = ['new', 'restock', 'price-drop'];

const COUNT_WORDS = {
  new: (n) => `${n} newly listed`,
  restock: (n) => `${n} back in stock`,
  'price-drop': (n) => `${n} lower ${n === 1 ? 'price' : 'prices'}`,
};

// "Analogue Wonderland: 4 newly listed, 6 back in stock". Counts what changed,
// never ranks the shop against others.
export function rollupTitle(retailer, children) {
  const parts = CHANGES
    .map((c) => [c, children.filter((ch) => ch.change === c).length])
    .filter(([, n]) => n > 0)
    .map(([c, n]) => COUNT_WORDS[c](n));
  return `${retailer}: ${parts.join(', ')}`;
}

const gbp = (n) => '£' + Number(n).toFixed(2);

// One line of an item's list, after the film's name. The price is the shop's
// price for a single item of the listing (one roll, one pack of instant film,
// one box of sheets), never a multipack, so it is stated without a unit.
export function changeLine(ch) {
  if (ch.change === 'new') return ch.price != null ? `newly listed at ${gbp(ch.price)}` : 'newly listed';
  if (ch.change === 'restock') {
    const gap = ch.outDays >= 2 ? ` after ${ch.outDays} days out of stock` : '';
    return `back in stock${gap}`;
  }
  if (ch.change === 'price-drop') return `now ${gbp(ch.price)}, was ${gbp(ch.was)}`;
  return ch.change;
}
