'use client';
import { useState } from 'react';
import Link from 'next/link';
import { StoreLogo } from './store-logo';

// The /stores/ grid and its "photo labs" filter. Like the opportunities board,
// the filter is state rather than a URL, and every card is in the static HTML,
// so the page reads in full before (or without) hydration.
export function StoreDirectory({ stores }) {
  const [labsOnly, setLabsOnly] = useState(false);
  const labCount = stores.filter((s) => s.lab).length;

  return (
    <>
      <div className="chips store-filter" role="group" aria-label="Filter shops">
        <button type="button" className={`chip${!labsOnly ? ' current' : ''}`} aria-pressed={!labsOnly} onClick={() => setLabsOnly(false)}>
          All shops <span className="chip-count">{stores.length}</span>
        </button>
        <button type="button" className={`chip${labsOnly ? ' current' : ''}`} aria-pressed={labsOnly} onClick={() => setLabsOnly(true)}>
          Also a photo lab <span className="chip-count">{labCount}</span>
        </button>
      </div>
      <div className="store-grid">
        {stores.map((s) => (
          <Link key={s.slug} href={`/store/${s.slug}`} className="store-card" hidden={labsOnly && !s.lab}>
            <StoreLogo store={s} size="md" />
            <span className="store-card-name">{s.name}</span>
            <span className="store-card-town">{s.town}</span>
            {s.lab && <span className="store-badge">Photo lab</span>}
            <span className="store-card-count">{s.count} films tracked</span>
          </Link>
        ))}
      </div>
    </>
  );
}
