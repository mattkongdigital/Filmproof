import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'Privacy policy',
    description: 'How Filmproof handles data, cookies and analytics.',
    alternates: { canonical: `${SITE_URL}/privacy` },
  };
}

export default function Privacy() {
  return (
    <div className="wrap doc">
      <h1>Privacy policy</h1>
      <div className="updated">Last reviewed: 6 August 2026</div>

      <p className="lead">
        Filmproof is a static information site with no accounts, no logins and no on-site purchases.
        This page explains the limited data involved in running it, chiefly website analytics.
      </p>

      <h2>Who is responsible</h2>
      <p>
        Filmproof is operated by <strong>Matthew Kong</strong>, a sole trader based in
        the United Kingdom. For any privacy question, contact{' '}
        <a href="mailto:matt@filmproof.co.uk">matt@filmproof.co.uk</a>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Hosting logs.</strong> The site is hosted on GitHub Pages. Like almost all web
          hosts, GitHub may automatically record basic technical information (such as your IP address
          and browser type) to deliver the site and keep it secure. This is handled under GitHub's own
          privacy practices.
        </li>
        <li>
          <strong>Analytics.</strong> With your consent, we use <strong>Google Analytics 4 (GA4)</strong>{' '}
          to understand how the site is used, which films and pages are popular, roughly where visitors
          come from, and what device they're on. GA4 sets cookies and processes data (including your IP
          address and a randomised identifier) on our behalf as a data processor. It helps us improve
          the site; it is not used to identify you personally, and we don't sell any data.
        </li>
        <li>
          <strong>Emails you send us.</strong> If you email us, we keep your message and address for as
          long as needed to deal with your query. There's no contact form and no newsletter, we don't
          collect email addresses to market to you.
        </li>
      </ul>

      <h2>Cookies and consent</h2>
      <p>
        The only non-essential cookies Filmproof uses are Google Analytics cookies. Because these
        aren't strictly necessary, we ask for your consent <strong>before</strong> they're set, using
        a cookie banner. Until you accept, analytics cookies are not loaded. You can accept or reject,
        and change your choice at any time using the “Cookie settings” link in the footer.
      </p>

      <h2>Sharing and international transfers</h2>
      <p>
        We don't sell or share your personal data for marketing. Our analytics provider (Google) and
        host (GitHub) may process data outside the UK; where they do, they rely on appropriate legal
        safeguards for international transfers.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you have rights over any personal data held about you, including
        the right to access it, correct it, ask for it to be deleted, object to processing, and
        withdraw consent for analytics at any time. To exercise these rights, email us at the address
        above. You also have the right to complain to the Information Commissioner's Office (ICO) at{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>
    </div>
  );
}
