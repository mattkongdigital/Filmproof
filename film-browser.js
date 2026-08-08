'use client';
import { useMemo, useState } from 'react';
import { FilmCard } from './film-card';
import { formatLabel } from '../lib/data';

const typeOf = (f) => {
  const p = f.process || '';
  if (/black/i.test(p)) return 'bw';
  if (/slide|e-6/i.test(p)) return 'slide';
  if (/colour|color/i.test(p)) return 'colour';
  if (/cine/i.test(p)) return 'cine';
  return 'other';
};
const TYPE_LABEL = { colour: 'Colour', bw: 'Black & white', slide: 'Slide', instant: 'Instant', cine: 'Cine', other: 'Other' };
const uniqSort = (arr, cmp) => [...new Set(arr)].sort(cmp);

export function FilmBrowser({ films }) {
  const [iso, setIso] = useState(() => new Set());
  const [fmt, setFmt] = useState(() => new Set());
  const [typ, setTyp] = useState(() => new Set());
  const [inStock, setInStock] = useState(false);

  // Available values per axis — an axis only appears if it varies in this list.
  const isoVals = useMemo(() => uniqSort(films.map((f) => f.iso).filter((v) => v != null), (a, b) => a - b), [films]);
  const fmtVals = useMemo(() => uniqSort(films.map((f) => f.format).filter(Boolean)), [films]);
  const typVals = useMemo(() => uniqSort(films.map(typeOf)), [films]);
  const hasStockMix = useMemo(() => films.some((f) => f.best != null) && films.some((f) => f.best == null), [films]);

  const filtered = useMemo(() => films.filter((f) =>
    (iso.size === 0 || iso.has(f.iso)) &&
    (fmt.size === 0 || fmt.has(f.format)) &&
    (typ.size === 0 || typ.has(typeOf(f))) &&
    (!inStock || f.best != null)
  ), [films, iso, fmt, typ, inStock]);

  if (!films.length) {
    return <p className="empty">No film here yet — check back once more shops are added.</p>;
  }

  const active = iso.size || fmt.size || typ.size || inStock;
  const reset = () => { setIso(new Set()); setFmt(new Set()); setTyp(new Set()); setInStock(false); };
  const toggler = (setter) => (val) => setter((prev) => {
    const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n;
  });

  const showIso = isoVals.length > 1, showFmt = fmtVals.length > 1, showTyp = typVals.length > 1;
  const anyAxis = showIso || showFmt || showTyp || hasStockMix;

  return (
    <div className="browser">
      {anyAxis && (
        <div className="filters">
          {showTyp && <Axis label="Type" items={typVals.map((v) => [v, TYPE_LABEL[v]])} sel={typ} on={toggler(setTyp)} />}
          {showFmt && <Axis label="Format" items={fmtVals.map((v) => [v, formatLabel(v)])} sel={fmt} on={toggler(setFmt)} />}
          {showIso && <Axis label="ISO" items={isoVals.map((v) => [v, String(v)])} sel={iso} on={toggler(setIso)} />}
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
        <div className="grid">{filtered.map((f) => <FilmCard key={f.slug} film={f} />)}</div>
      ) : (
        <p className="empty">No film matches those filters. <button className="reset" onClick={reset}>Reset</button></p>
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
