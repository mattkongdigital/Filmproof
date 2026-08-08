'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import index from '../data/search-index.json';

const FMT = { '135': '35mm', '120': '120', '110': '110', '127': '127', instant: 'instant', sheet: 'sheet', movie: 'cine', bulk: 'bulk' };
const gbp = (n) => '£' + Number(n).toFixed(2);

// Precompute a lowercase haystack per film once, at module load.
const ITEMS = index.map((f) => ({
  ...f,
  hay: `${f.display} ${f.brand} ${f.iso ?? ''} ${FMT[f.format] ?? f.format ?? ''}`.toLowerCase(),
}));

export function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const words = query.split(/\s+/);
    const scored = [];
    for (const it of ITEMS) {
      if (words.every((w) => it.hay.includes(w))) {
        const starts = it.display.toLowerCase().startsWith(query) ? 0 : 1;
        scored.push({ it, score: starts * 1000 + it.display.length });
      }
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 8).map((s) => s.it);
  }, [q]);

  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const close = () => { setOpen(false); setQ(''); };

  return (
    <div className="search" ref={boxRef}>
      <input
        className="search-input"
        type="search"
        placeholder="Search film…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) { close(); router.push(`/film/${results[0].slug}`); }
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-label="Search film"
      />
      {open && q.trim().length >= 2 && (
        <div className="search-results" role="listbox">
          {results.length ? results.map((f) => (
            <Link key={f.slug} href={`/film/${f.slug}`} className="search-hit" onClick={close}>
              <span className="hit-name">{f.display}</span>
              <span className="hit-meta">
                {(FMT[f.format] ?? f.format) || ''}{f.iso ? ` · ISO ${f.iso}` : ''}{f.best != null ? ` · from ${gbp(f.best)}` : ''}
              </span>
            </Link>
          )) : <div className="search-empty">No film matches “{q.trim()}”.</div>}
        </div>
      )}
    </div>
  );
}
