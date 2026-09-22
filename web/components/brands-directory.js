'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

// The A–Z brand index. Everything it can show is rendered into the static HTML
// — every letter section, every brand, and the "most tracked" cards — so the
// page is complete and crawlable with no JS. Search only hides and shows what
// is already there; nothing is fetched and no list is built on the fly.

const FILMS_SHOWN = 3;

// A brand matches on its own name, or on any of its films' names. A film-only
// match is worth showing the film for — "portra" landing on Kodak with no
// reason given reads as a bug — so the matched titles come back with it.
function matchBrand(brand, query) {
  if (brand.label.toLowerCase().includes(query)) return { hit: true, films: [] };
  const films = brand.films.filter((f) => f.toLowerCase().includes(query));
  return { hit: films.length > 0, films };
}

export function BrandsDirectory({ groups, top }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const searching = query.length > 0;

  // slug -> { hit, films } while searching; null when the full list is showing,
  // which is also the state the server renders.
  const matches = useMemo(() => {
    if (!searching) return null;
    const m = new Map();
    for (const g of groups) for (const b of g.brands) m.set(b.slug, matchBrand(b, query));
    return m;
  }, [groups, query, searching]);

  const shown = (brand) => (matches ? matches.get(brand.slug).hit : true);
  const visibleLetters = groups.filter((g) => g.brands.some(shown)).map((g) => g.letter);
  const nothing = searching && visibleLetters.length === 0;

  return (
    <div className="az">
      <div className="az-search">
        <label className="az-search-label" htmlFor="brand-search">Search brands</label>
        <input
          id="brand-search"
          className="search-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Brand or film name…"
          autoComplete="off"
        />
      </div>

      <nav className="az-letters" aria-label="Jump to letter">
        {groups.map((g) => (
          <a
            key={g.letter}
            className="az-letter"
            href={`#brands-${letterId(g.letter)}`}
            hidden={!visibleLetters.includes(g.letter)}
          >
            {g.letter}
          </a>
        ))}
      </nav>

      <section className="top-brands" aria-labelledby="top-brands-head" hidden={searching}>
        <h2 className="az-head" id="top-brands-head">Most tracked brands</h2>
        <p className="az-sub">Ranked by how many listings across our shops each maker has right now.</p>
        <ol className="top-list">
          {top.map((b, i) => (
            <li key={b.slug}>
              <Link href={`/brand/${b.slug}`} className="top-item">
                <span className="top-rank">{i + 1}</span>
                <span className="top-name">{b.label}</span>
                <span className="top-count">
                  {b.listings} listing{b.listings === 1 ? '' : 's'} across {b.shops} shop{b.shops === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <h2 className="az-head" hidden={nothing}>Every brand A–Z</h2>
      {groups.map((g) => (
        <section
          key={g.letter}
          className="az-group"
          id={`brands-${letterId(g.letter)}`}
          aria-labelledby={`brands-${letterId(g.letter)}-head`}
          hidden={!visibleLetters.includes(g.letter)}
        >
          <h3 className="az-group-head" id={`brands-${letterId(g.letter)}-head`}>{g.letter}</h3>
          <div className="brand-list">
            {g.brands.map((b) => {
              const m = matches?.get(b.slug);
              return (
                <Link key={b.slug} href={`/brand/${b.slug}`} className="brand-item" hidden={!shown(b)}>
                  <span className="brand-name">
                    {b.label}
                    {m && m.films.length > 0 && (
                      <span className="brand-hit">
                        {m.films.slice(0, FILMS_SHOWN).join(', ')}
                        {m.films.length > FILMS_SHOWN ? ` +${m.films.length - FILMS_SHOWN} more` : ''}
                      </span>
                    )}
                  </span>
                  <span className="brand-count">{b.count}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {nothing && <p className="empty">No brand or film matches “{q.trim()}”.</p>}
    </div>
  );
}

// "#" is not an id, and it is the only letter that is not already one.
const letterId = (letter) => (letter === '#' ? 'num' : letter.toLowerCase());
