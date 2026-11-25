'use client';

import { useState } from 'react';
import { NEWS_TYPES, displayDay, changeLine } from '../lib/news-format.mjs';

// The tag line over an item: what kind of news it is, and for a shop update
// what kind of change earned it its own item.
const KIND_LABEL = {
  rollup: 'Shop update',
  'new-film': 'New to Filmproof',
  'back-everywhere': 'Back in stock',
  'back-at-shop': 'Back at a shop',
};

// The feed and its type filter. The filter is state, not a URL: /news/ is one
// evergreen page with no per-type addresses. Every item is in the HTML, so it
// reads fine before (or without) hydration. Items arrive newest first and are
// grouped by the UK day they were first seen.
export function NewsFeed({ items, empty }) {
  const [type, setType] = useState('all');
  const counts = Object.fromEntries(NEWS_TYPES.map((t) => [t.id, items.filter((it) => it.type === t.id).length]));
  const shown = type === 'all' ? items : items.filter((it) => it.type === type);
  const days = [];
  for (const it of shown) {
    if (days.length === 0 || days[days.length - 1].date !== it.date) days.push({ date: it.date, items: [] });
    days[days.length - 1].items.push(it);
  }

  return (
    <>
      {items.length > 0 && (
        <div className="chips opp-filter" role="group" aria-label="Filter by type">
          <button type="button" className={`chip${type === 'all' ? ' current' : ''}`} aria-pressed={type === 'all'} onClick={() => setType('all')}>
            All <span className="chip-count">{items.length}</span>
          </button>
          {NEWS_TYPES.filter((t) => counts[t.id] > 0).map((t) => (
            <button key={t.id} type="button" className={`chip${type === t.id ? ' current' : ''}`} aria-pressed={type === t.id} onClick={() => setType(t.id)}>
              {t.label} <span className="chip-count">{counts[t.id]}</span>
            </button>
          ))}
        </div>
      )}

      {days.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        days.map((d) => (
          <section key={d.date} className="news-day">
            <h2 className="news-day-head"><time dateTime={d.date}>{displayDay(d.date, { weekday: true })}</time></h2>
            <ul className="opp-list news-list">
              {d.items.map((it) => <NewsItem key={it.id} it={it} />)}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

function NewsItem({ it }) {
  const typeLabel = NEWS_TYPES.find((t) => t.id === it.type)?.one || it.type;
  const tag = it.type === 'shop-update' ? KIND_LABEL[it.kind] || typeLabel : typeLabel;
  const sourceName = it.source?.kind === 'retailer' || it.type !== 'shop-update' ? it.source?.name : null;
  const children = it.children || [];
  return (
    <li className="opp news-item">
      <div className="opp-tags">{[tag, sourceName].filter(Boolean).join(' · ')}</div>
      <h3 className="opp-title news-title">
        {it.url ? <a href={it.url} rel="noopener nofollow" target="_blank">{it.title}</a>
          : it.film?.href ? <a href={it.film.href}>{it.title}</a>
          : it.title}
      </h3>
      {it.summary && <p className="opp-summary">{it.summary}</p>}
      {it.kind === 'back-everywhere' && (
        <p className="news-note">Out of stock at every shop we track for {it.outDays} days before this.</p>
      )}
      {children.length > 0 && (it.kind === 'rollup'
        ? (
          <details className="news-more">
            <summary>
              <span className="news-more-open">Show all {children.length}</span>
              <span className="news-more-close">Hide the list</span>
            </summary>
            <ChangeList changes={children} by="film" />
          </details>
        )
        : <ChangeList changes={children} by="shop" />)}
      {it.type === 'shop-news' && it.url && (
        <a className="opp-out" href={it.url} rel="noopener nofollow" target="_blank">Read it on {it.source?.name}&apos;s blog →</a>
      )}
      {it.kind === 'rollup' && it.source?.href && (
        <a className="opp-out" href={it.source.href}>Everything {it.source.name} stocks →</a>
      )}
    </li>
  );
}

// A roll-up lists films (the shop is the item's); a notable item is one film,
// so it lists the shops.
function ChangeList({ changes, by }) {
  return (
    <ul className="news-changes">
      {changes.map((c) => (
        <li key={`${c.change}|${c.film?.key}|${c.retailer}`}>
          {by === 'film'
            ? (c.film?.href ? <a href={c.film.href}>{c.film.display}</a> : <span>{c.film?.display}</span>)
            : (c.storeHref ? <a href={c.storeHref}>{c.retailer}</a> : <span>{c.retailer}</span>)}
          {', '}{changeLine(c)}.
          {c.offerUrl && (
            <>
              {' '}
              <a className="news-shop-link" href={c.offerUrl} target="_blank" rel="noopener noreferrer">View at {c.retailer} →</a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
