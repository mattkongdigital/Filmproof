'use client';
import { useState } from 'react';

// A chip row that starts folded, so long rows don't push the films down the
// page. Folded, it keeps its label, the chip for the current page and any filter
// that is on, and hides the rest behind a "Show N <noun>" toggle. The hidden
// chips are still rendered (CSS hides them), so the links stay in the HTML for
// crawlers. `count` is how many chips folding hides; `noun` is its plural
// ("formats"), which loses its "s" for a count of one.
export function FoldAxis({ label, count, noun, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`axis${open ? '' : ' folded'}`}>
      <span className="axis-label">{label}</span>
      {children}
      {count > 0 && (
        <button type="button" className="fchip axis-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : `Show ${count} ${count === 1 ? noun.replace(/s$/, '') : noun}`}
        </button>
      )}
    </div>
  );
}
