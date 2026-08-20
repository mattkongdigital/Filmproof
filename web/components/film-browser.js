'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import { FilmCard } from './film-card';
import { formatLabel } from '../lib/data';
import { EmptyState } from './empty-state';

const PER_PAGE = 24;

// Build a compact page list like [1, 2, 3, '…', 10] around the current page.
function pageList(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out = [1];
  const lo = Math.max(2, page - 1), hi = Math.min(count - 1, page + 1);
  if (lo > 2) out.push('…');
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < count - 1) out.push('…');
  out.push(count);
  return out;
}

const typeOf = (f) => {
  const p = f.process || '';
  if (/black/i.test(p)) return 'bw';
  if (/slide|e-6/i.test(p)) return 'slide';
  if (/colour|color/i.test(p)) return 'colour';
  if (/cine/i.test(p)) return 'cine';
  return 'other';
};
const TYPE_LABEL = { colour: 'Colour', bw: 'Black & white', slide: 'Slide', instant: 'Instant', cine: 'Cine', other: 'Other' };
// Condition is the third browse axis (see lib/facets.js). Expired stock is
// usually the cheapest thing in a list, so being able to filter it out matters.
const conditionOf = (f) => (f.expired ? 'expired' : 'fresh');
const CONDITION_LABEL = { fresh: 'Fresh', expired: 'Expired' };
const uniqSort = (arr, cmp) => [...new Set(arr)].sort(cmp);

export function FilmBrowser({ films, hideAxes = [] }) {
  const [iso, setIso] = useState(() => new Set());
  const [fmt, setFmt] = useState(() => new Set());
  const [typ, setTyp] = useState(() => new Set());
  const [cond, setCond] = useState(() => new Set());
  const [inStock, setInStock] = useState(false);

  // Available values per axis — an axis only appears if it varies in this list.
  const isoVals = useMemo(() => uniqSort(films.map((f) => f.iso).filter((v) => v != null), (a, b) => a - b), [films]);
  const fmtVals = useMemo(() => uniqSort(films.map((f) => f.format).filter(Boolean)), [films]);
  const typVals = useMemo(() => uniqSort(films.map(typeOf)), [films]);
  const condVals = useMemo(() => uniqSort(films.map(conditionOf)), [films]);
  const hasStockMix = useMemo(() => films.some((f) => f.best != null) && films.some((f) => f.best == null), [films]);

  const filtered = useMemo(() => films.filter((f) =>
    (iso.size === 0 || iso.has(f.iso)) &&
    (fmt.size === 0 || fmt.has(f.format)) &&
    (typ.size === 0 || typ.has(typeOf(f))) &&
    (cond.size === 0 || cond.has(conditionOf(f))) &&
    (!inStock || f.best != null)
  ), [films, iso, fmt, typ, cond, inStock]);

  const [page, setPage] = useState(1);
  const topRef = useRef(null);
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  // Whenever the filtered set changes, jump back to page 1.
  useEffect(() => { setPage(1); }, [filtered]);
  const goToPage = (p) => {
    setPage(p);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  if (!films.length) {
    return <p className="empty">No film here yet, check back once more shops are added.</p>;
  }

  const active = iso.size || fmt.size || typ.size || cond.size || inStock;
  const reset = () => { setIso(new Set()); setFmt(new Set()); setTyp(new Set()); setCond(new Set()); setInStock(false); };
  const toggler = (setter) => (val) => setter((prev) => {
    const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n;
  });

  const showIso = isoVals.length > 1 && !hideAxes.includes('iso');
  const showFmt = fmtVals.length > 1 && !hideAxes.includes('fmt');
  const showTyp = typVals.length > 1 && !hideAxes.includes('typ');
  const showCond = condVals.length > 1 && !hideAxes.includes('cond');
  const anyAxis = showIso || showFmt || showTyp || showCond || hasStockMix;

  return (
    <div className="browser">
      <div ref={topRef} />
      {anyAxis && (
        <div className="filters">
          {showTyp && <Axis label="Type" items={typVals.map((v) => [v, TYPE_LABEL[v]])} sel={typ} on={toggler(setTyp)} />}
          {showFmt && <Axis label="Format" items={fmtVals.map((v) => [v, formatLabel(v)])} sel={fmt} on={toggler(setFmt)} />}
          {showIso && <Axis label="ISO" items={isoVals.map((v) => [v, String(v)])} sel={iso} on={toggler(setIso)} />}
          {showCond && <Axis label="Condition" items={condVals.map((v) => [v, CONDITION_LABEL[v]])} sel={cond} on={toggler(setCond)} />}
          {hasStockMix && (
            <div className="axis">
              <span className="axis-label">Stock</span>
              <button className={`fchip${inStock ? ' on' : ''}`} aria-pressed={inStock} onClick={() => setInStock((v) => !v)}>In stock only</button>
            </div>
          )}
          <div className="filter-meta">
            Showing <b>{filtered.length}</b> of {films.length}
            {active ? <button className="reset" onClick={reset}>Reset</button> : null}
          </div>
        </div>
      )}

      {filtered.length ? (
        <>
          <div className="grid">
            {filtered.map((f, i) => <FilmCard key={f.slug} film={f} hidden={i < start || i >= end} />)}
          </div>
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => goToPage(page - 1)} aria-label="Previous page">‹ Prev</button>
              {pageList(page, pageCount).map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className="page-gap">…</span>
                  : <button key={p} className={`page-btn${p === page ? ' current' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => goToPage(p)}>{p}</button>
              )}
              <button className="page-btn" disabled={page === pageCount} onClick={() => goToPage(page + 1)} aria-label="Next page">Next ›</button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title="Nothing matches those filters"
          message="No film in this list matches every filter you've picked. Clearing them will bring the full list back."
          action={<button className="empty-action" onClick={reset}>Clear filters</button>}
        />
      )}
    </div>
  );
}

function Axis({ label, items, sel, on }) {
  return (
    <div className="axis">
      <span className="axis-label">{label}</span>
      {items.map(([val, lab]) => (
        <button key={val} className={`fchip${sel.has(val) ? ' on' : ''}`} aria-pressed={sel.has(val)} onClick={() => on(val)}>{lab}</button>
      ))}
    </div>
  );
}
