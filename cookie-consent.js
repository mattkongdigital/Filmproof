'use client';
import { useState, useEffect } from 'react';
import { GA_ID } from '../lib/config';

const KEY = 'filmproof-consent';

// The banner. Shows once until a choice is made; re-openable via the footer link.
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    try { if (!localStorage.getItem(KEY)) setVisible(true); } catch (e) {}
    const open = () => setVisible(true);
    window.addEventListener('filmproof:cookie-settings', open);
    return () => window.removeEventListener('filmproof:cookie-settings', open);
  }, []);

  const choose = (granted) => {
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch (e) {}
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    }
    setVisible(false);
  };

  if (!GA_ID || !visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p className="cookie-text">
        We'd like to set Google Analytics cookies to see which films and pages are popular, so we can
        make Filmproof better. Nothing is set unless you accept. See our{' '}
        <a href="/privacy">privacy policy</a>.
      </p>
      <div className="cookie-actions">
        <button className="cookie-btn reject" onClick={() => choose(false)}>Reject</button>
        <button className="cookie-btn accept" onClick={() => choose(true)}>Accept</button>
      </div>
    </div>
  );
}

// Footer link that re-opens the banner so a visitor can change their mind.
export function CookieSettingsLink() {
  if (!GA_ID) return null;
  return (
    <button
      type="button"
      className="foot-cookie"
      onClick={() => window.dispatchEvent(new Event('filmproof:cookie-settings'))}
    >
      Cookie settings
    </button>
  );
}
