'use client';
import { useState } from 'react';
import Link from 'next/link';
import { StoreLogo } from './store-logo';
import { STORE_SERVICES, storeServices } from '../lib/store-services';

// The /stores/ grid and its service filter (photo labs, camera repairs). Like
// the opportunities board, the filter is state rather than a URL, and every
// card is in the static HTML, so the page reads in full before (or without)
// hydration.
export function StoreDirectory({ stores }) {
  const [service, setService] = useState('all');
  const offers = (s, key) => (s.services || []).includes(key);
  const counts = Object.fromEntries(STORE_SERVICES.map((x) => [x.key, stores.filter((s) => offers(s, x.key)).length]));

  return (
    <>
      <div className="chips store-filter" role="group" aria-label="Filter shops">
        <button type="button" className={`chip${service === 'all' ? ' current' : ''}`} aria-pressed={service === 'all'} onClick={() => setService('all')}>
          All shops <span className="chip-count">{stores.length}</span>
        </button>
        {STORE_SERVICES.filter((x) => counts[x.key] > 0).map((x) => (
          <button key={x.key} type="button" className={`chip${service === x.key ? ' current' : ''}`} aria-pressed={service === x.key} onClick={() => setService(x.key)}>
            {x.filter} <span className="chip-count">{counts[x.key]}</span>
          </button>
        ))}
      </div>
      <div className="store-grid">
        {stores.map((s) => (
          <Link key={s.slug} href={`/store/${s.slug}`} className="store-card" hidden={service !== 'all' && !offers(s, service)}>
            <StoreLogo store={s} size="md" />
            <span className="store-card-name">{s.name}</span>
            <span className="store-card-town">{s.town}</span>
            <StoreBadges store={s} />
            <span className="store-card-count">{s.count} films tracked</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function StoreBadges({ store }) {
  const services = storeServices(store);
  if (!services.length) return null;
  return (
    <span className="store-badges">
      {services.map((x) => <span key={x.key} className="store-badge">{x.badge}</span>)}
    </span>
  );
}
