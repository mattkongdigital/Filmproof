'use client';
import Link from 'next/link';
import { useState } from 'react';
import { gbp, formatLabel } from '../lib/data';

export function FilmCard({ film }) {
  const [failed, setFailed] = useState(false);
  const show = film.image && !failed;

  return (
    <Link href={`/film/${film.slug}`} className="card">
      <div className="card-shot">
        {show ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={film.image} alt={film.display} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <div className="card-placeholder" role="img" aria-label="No image">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="10" y="8" width="20" height="32" rx="2" />
              <path d="M30 14h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6" />
              <circle cx="20" cy="26" r="5" />
            </svg>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-name">{film.display}</div>
        <div className="card-meta">{formatLabel(film.format)}{film.iso ? ` · ISO ${film.iso}` : ''}</div>
        <div className="card-price">
          {film.best != null ? <><span className="from">from</span> {gbp(film.best)}<span className="per">/roll</span></> : <span className="nostock">check price</span>}
        </div>
      </div>
    </Link>
  );
}

export function FilmGrid({ films }) {
  if (!films.length) return <p className="empty">No film here yet — check back once more shops are added.</p>;
  return <div className="grid">{films.map((f) => <FilmCard key={f.slug} film={f} />)}</div>;
}
