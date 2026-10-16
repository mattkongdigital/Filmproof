'use client';

import { useEffect, useState } from 'react';
import {
  OPPORTUNITY_TYPES, ukToday, lastLiveDay, displayDay, feeLabel, rightsLabel, REGION_LABEL,
} from '../lib/opportunity-format';

// The board's list and its type filter. The filter is state, not a URL: one
// evergreen page, no per-type addresses to churn. Every entry is in the HTML,
// so the board reads fine before (or without) hydration.
export function OpportunityBoard({ items }) {
  const [type, setType] = useState('all');
  // Expiry is decided at build time, and the site rebuilds daily — but a page
  // can sit in a cache or a tab past midnight. Once hydrated, anything that has
  // closed since the build is hidden too.
  const [today, setToday] = useState(null);
  useEffect(() => setToday(ukToday()), []);

  const open = today ? items.filter((o) => lastLiveDay(o) >= today) : items;
  const counts = Object.fromEntries(OPPORTUNITY_TYPES.map((t) => [t.slug, open.filter((o) => o.type === t.slug).length]));
  const shown = type === 'all' ? open : open.filter((o) => o.type === type);

  return (
    <>
      <div className="chips opp-filter" role="group" aria-label="Filter by type">
        <button type="button" className={`chip${type === 'all' ? ' current' : ''}`} aria-pressed={type === 'all'} onClick={() => setType('all')}>
          All <span className="chip-count">{open.length}</span>
        </button>
        {OPPORTUNITY_TYPES.filter((t) => counts[t.slug] > 0).map((t) => (
          <button key={t.slug} type="button" className={`chip${type === t.slug ? ' current' : ''}`} aria-pressed={type === t.slug} onClick={() => setType(t.slug)}>
            {t.label} <span className="chip-count">{counts[t.slug]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">Nothing open in this list right now. The board is checked every week.</p>
      ) : (
        <ul className="opp-list">
          {shown.map((o) => <OpportunityCard key={o.key} o={o} />)}
        </ul>
      )}
    </>
  );
}

function OpportunityCard({ o }) {
  const kind = OPPORTUNITY_TYPES.find((t) => t.slug === o.type)?.one || o.type;
  const tags = [kind, o.region && REGION_LABEL[o.region], o.film === 'film-specific' ? 'Film only' : null].filter(Boolean);
  return (
    <li className="opp">
      <div className="opp-tags">{tags.join(' · ')}</div>
      <h2 className="opp-title">
        <a href={o.official_url} rel="noopener nofollow" target="_blank">{o.title}</a>
      </h2>
      <div className="opp-org">{o.organiser}</div>
      {o.summary && <p className="opp-summary">{o.summary}</p>}
      <dl className="opp-facts">
        <div>
          <dt>Closes</dt>
          <dd>{o.deadline ? <time dateTime={o.deadline}>{displayDay(o.deadline)}</time> : 'See the official page'}</dd>
        </div>
        <div>
          <dt>Entry</dt>
          <dd>{feeLabel(o.fee)}</dd>
        </div>
        {o.eligibility && (
          <div>
            <dt>Who</dt>
            <dd>{o.eligibility}</dd>
          </div>
        )}
      </dl>
      {o.rights.flags.length > 0 && (
        <div className="opp-rights">
          <span className="opp-rights-head">Read the rights terms:</span>{' '}
          {o.rights.flags.map((f) => <span key={f} className="opp-flag">{rightsLabel(f)}</span>)}
        </div>
      )}
      <a className="opp-out" href={o.official_url} rel="noopener nofollow" target="_blank">
        Full details and terms on the official page →
      </a>
    </li>
  );
}
