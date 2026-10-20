'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SearchBox } from './search-box';
import { SOCIAL_LINKS } from '../lib/config';

const SOCIAL_ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  ),
};

export function NavBar({ formats, types, conditions = [], brands = [] }) {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopRef = useRef(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setShopOpen(false); } };
    const onClick = (e) => { if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" onClick={close}>Filmproof</Link>

      {/* desktop search (hidden on mobile) */}
      <SearchBox />

      {/* desktop mega menu (hidden on mobile) */}
      <div className="nav-groups nav-desktop">
        <div className="nav-mega" ref={shopRef}>
          <button
            type="button"
            className="nav-mega-trigger"
            aria-expanded={shopOpen}
            onClick={() => setShopOpen((v) => !v)}
          >
            Browse <span className="nav-mega-caret" data-open={shopOpen}>▾</span>
          </button>
          {shopOpen && (
            <div className="nav-mega-panel">
              <div className="nav-mega-col">
                <span className="nav-head">Format</span>
                {formats.map((f) => <Link key={f.slug} href={`/${f.slug}`} onClick={() => setShopOpen(false)}>{f.label}</Link>)}
              </div>
              <div className="nav-mega-col">
                <span className="nav-head">Type</span>
                {types.map((t) => <Link key={t.slug} href={`/${t.slug}`} onClick={() => setShopOpen(false)}>{t.label}</Link>)}
              </div>
              {conditions.length > 0 && (
                <div className="nav-mega-col">
                  <span className="nav-head">Condition</span>
                  {conditions.map((c) => <Link key={c.slug} href={`/${c.slug}`} onClick={() => setShopOpen(false)}>{c.label}</Link>)}
                </div>
              )}
              <div className="nav-mega-col">
                <span className="nav-head">Brands</span>
                {brands.map((b) => <Link key={b.slug} href={`/brand/${b.slug}`} onClick={() => setShopOpen(false)}>{b.label}</Link>)}
                <Link href="/brands" className="nav-mega-all" onClick={() => setShopOpen(false)}>All brands →</Link>
              </div>
              <div className="nav-mega-col">
                <span className="nav-head">More</span>
                <Link href="/stores" onClick={() => setShopOpen(false)}>All stores</Link>
              </div>
            </div>
          )}
        </div>
        <div className="nav-social">
          {SOCIAL_LINKS.map((s) => (
            <a key={s.id} href={s.href} target="_blank" rel="me noopener" aria-label={`Filmproof on ${s.label}`} title={s.label}>
              {SOCIAL_ICONS[s.id]}
            </a>
          ))}
        </div>
      </div>

      {/* mobile hamburger (hidden on desktop) */}
      <button
        className="nav-burger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="burger-lines" data-open={open}><span /><span /><span /></span>
      </button>

      {/* mobile drawer */}
      {open && (
        <div className="nav-drawer">
          <div className="drawer-search"><SearchBox /></div>
          <div className="drawer-section">
            <span className="drawer-head">Format</span>
            <div className="drawer-links">
              {formats.map((f) => <Link key={f.slug} href={`/${f.slug}`} onClick={close}>{f.label}</Link>)}
            </div>
          </div>
          <div className="drawer-section">
            <span className="drawer-head">Type</span>
            <div className="drawer-links">
              {types.map((t) => <Link key={t.slug} href={`/${t.slug}`} onClick={close}>{t.label}</Link>)}
            </div>
          </div>
          {conditions.length > 0 && (
            <div className="drawer-section">
              <span className="drawer-head">Condition</span>
              <div className="drawer-links">
                {conditions.map((c) => <Link key={c.slug} href={`/${c.slug}`} onClick={close}>{c.label}</Link>)}
              </div>
            </div>
          )}
          {brands.length > 0 && (
            <div className="drawer-section">
              <span className="drawer-head">Brands</span>
              <div className="drawer-links">
                {brands.map((b) => <Link key={b.slug} href={`/brand/${b.slug}`} onClick={close}>{b.label}</Link>)}
              </div>
            </div>
          )}
          <div className="drawer-section">
            <Link href="/brands" className="drawer-brands" onClick={close}>All brands →</Link>
            <Link href="/stores" className="drawer-brands" onClick={close}>All stores →</Link>
          </div>
          <div className="drawer-section">
            <span className="drawer-head">Follow</span>
            <div className="drawer-links drawer-social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="me noopener" onClick={close}>
                  {SOCIAL_ICONS[s.id]} {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
