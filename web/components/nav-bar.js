'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SearchBox } from './search-box';

export function NavBar({ formats, types }) {
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
              <div className="nav-mega-col">
                <span className="nav-head">More</span>
                <Link href="/brands" onClick={() => setShopOpen(false)}>All brands</Link>
                <Link href="/stores" onClick={() => setShopOpen(false)}>All stores</Link>
              </div>
            </div>
          )}
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
          <div className="drawer-section">
            <Link href="/brands" className="drawer-brands" onClick={close}>All brands →</Link>
            <Link href="/stores" className="drawer-brands" onClick={close}>All stores →</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
