import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'Contact',
    description: 'Get in touch with Filmproof — report a wrong price, suggest a shop, or ask a question.',
    alternates: { canonical: `${SITE_URL}/contact` },
  };
}

export default function Contact() {
  return (
    <div className="wrap doc">
      <h1>Contact</h1>
      <p className="lead">
        Questions, corrections and suggestions are all welcome — Filmproof gets better when people
        point out what's off.
      </p>

      <h2>Email</h2>
      <p>
        The best way to reach us is by email at{' '}
        <a href="mailto:matt@filmproof.co.uk">matt@filmproof.co.uk</a>.
      </p>

      <h2>Especially useful</h2>
      <ul>
        <li><strong>A price that looks wrong</strong> — tell us the film and the shop, and we'll take a look.</li>
        <li><strong>Two entries for the same film</strong> — matching is automated and occasionally slips; flagging it helps us fix it.</li>
        <li><strong>A UK shop we should add</strong> — especially independents.</li>
        <li><strong>A film on the wrong page</strong> — e.g. a black &amp; white stock showing as colour.</li>
      </ul>

      <p>
        Filmproof is a personal project run in spare time, so replies may not be instant — but
        every message is read.
      </p>
    </div>
  );
}
