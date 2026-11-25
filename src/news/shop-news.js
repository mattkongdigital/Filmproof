// src/news/shop-news.js — retailers' blog posts as "Shop news" items.
//
// Pure: given what each feed returned this build and the log so far, returns
// the next log. build-news.js does the fetching; src/news/test.js checks the
// rules without a network. See "News" in CLAUDE.md.
//
// An item is the post's title, linked to the shop's own page for it, dated by
// the day the shop published it. There is no summary: a post's text is the
// shop's writing, and the feed does not write one in our own words. The text
// is read only to decide whether a `filmOnly` shop's post is about film.

import { normaliseUrl, htmlToText } from '../../opportunities/lib.js';
import { ukDay, daysBetween, NEWS_WINDOW_DAYS } from '../../web/lib/news-format.mjs';
import { retailerSlug } from './shop-updates.js';

const FILM_WORDS = /\b(film|films|35\s?mm|120|medium format|darkroom|analogue|analog|negatives?|rolls?)\b/i;

// The UK day a feed date falls on, or null if it does not parse.
function publishedDay(raw) {
  const t = Date.parse(raw || '');
  return Number.isFinite(t) ? ukDay(new Date(t)) : null;
}

export const postId = (retailer, url) => `shop-news:${retailerSlug(retailer)}:${normaliseUrl(url)}`;

// `fetched` is [{ retailer, filmOnly, entries: [{ title, url, published, html }] }]
// for every feed that answered this build. A feed that failed is simply absent:
// its posts already in the log stay, and nothing about it is lost.
//
// Only a post published within the last NEWS_WINDOW_DAYS is posted. That one
// rule covers a shop's back catalogue on its first fetch (old posts never
// appear, recent ones appear on the day the shop published them), a shop
// re-dating an old article, and a post found late. A post already in the log
// keeps its date and first-seen time; a retitled one takes the new title.
export function mergeShopNews({ log = [], fetched, now = new Date() }) {
  const today = ukDay(now);
  const at = now.toISOString();
  const out = new Map(log.map((it) => [it.id, it]));
  const added = [];
  let skippedOld = 0;
  let skippedOffTopic = 0;
  for (const feed of fetched) {
    for (const e of feed.entries) {
      if (!e.url || !normaliseUrl(e.url)) continue;
      const id = postId(feed.retailer, e.url);
      const title = (e.title || '').replace(/\s+/g, ' ').trim();
      if (!title) continue;
      const old = out.get(id);
      if (old) {
        if (old.title !== title) out.set(id, { ...old, title });
        continue;
      }
      // A date in the future (a scheduled post the feed leaked, or a clock
      // mismatch) is dated today; a missing one, the day we first saw it.
      let date = publishedDay(e.published) || today;
      if (date > today) date = today;
      if (daysBetween(date, today) >= NEWS_WINDOW_DAYS) { skippedOld++; continue; }
      if (feed.filmOnly && !FILM_WORDS.test(`${title} ${htmlToText(e.html || '')}`)) { skippedOffTopic++; continue; }
      const item = {
        id, type: 'shop-news', kind: 'post', date, firstSeenAt: at,
        source: { kind: 'retailer', name: feed.retailer },
        title, summary: null, url: e.url,
      };
      out.set(id, item);
      added.push(item);
    }
  }
  const next = [...out.values()].sort((a, b) => b.date.localeCompare(a.date) || b.firstSeenAt.localeCompare(a.firstSeenAt) || a.id.localeCompare(b.id));
  return { log: next, added, skippedOld, skippedOffTopic };
}
