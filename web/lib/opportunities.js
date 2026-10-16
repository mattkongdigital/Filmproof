// lib/opportunities.js — the opportunities board's data.
// opportunities.json is written by the weekly pipeline in opportunities/ and
// lands only through a reviewed PR; see "Opportunities board" in CLAUDE.md.
// Nothing is ever deleted from it — a closed call stays on file as history and
// simply stops being live, which is decided here at build time.

import all from '../content/opportunities.json';
import { ukToday, lastLiveDay } from './opportunity-format';

// What the board shows: published, not past its last live day, soonest
// closing first, undated ones after every dated one.
export function liveOpportunities(today = ukToday()) {
  return all
    .filter((o) => o.publish === true && lastLiveDay(o) >= today)
    .sort((a, b) => {
      if (!a.deadline !== !b.deadline) return a.deadline ? -1 : 1;
      return (a.deadline || '').localeCompare(b.deadline || '') || a.title.localeCompare(b.title);
    });
}
