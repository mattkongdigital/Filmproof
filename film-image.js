'use client';
import { useState } from 'react';

// Always renders the sprocket frame at a fixed footprint. Falls back to a film
// placeholder when the image is missing OR fails to load, so the page shape is
// identical either way.
export function FilmImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  return (
    <div className="product-shot">
      <div className="shot-inner">
        {show ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <div className="shot-placeholder" role="img" aria-label="No image available">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="10" y="8" width="20" height="32" rx="2" />
              <path d="M30 14h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6" />
              <line x1="14" y1="14" x2="26" y2="14" />
              <circle cx="20" cy="26" r="5" />
            </svg>
            <span>no image</span>
          </div>
        )}
      </div>
    </div>
  );
}
