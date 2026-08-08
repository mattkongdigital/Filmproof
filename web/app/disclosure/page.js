import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'Advertising & funding',
    description: 'How Filmproof is funded, and our commitment that links to shops are plain, unpaid, and ranked purely by price.',
    alternates: { canonical: `${SITE_URL}/disclosure` },
  };
}

export default function Disclosure() {
  return (
    <div className="wrap doc">
      <h1>Advertising &amp; funding</h1>
      <p className="lead">
        Filmproof is free to use, and we think it's important to be open about how it's paid for —
        and how it isn't.
      </p>

      <h2>Right now: no ads, no paid links</h2>
      <p>
        At launch, Filmproof carries <strong>no advertising and no affiliate or sponsored links</strong>.
        The links out to shops are plain, ordinary links — we don't earn a commission when you follow
        them or buy something. We simply send you to the shop with the cheapest price.
      </p>

      <h2>Shops can't pay for position</h2>
      <p>
        Offers are ranked purely by price per roll, cheapest first. <strong>No shop can pay to appear
        higher, or to appear at all.</strong> Shops are included because they sell film we can compare —
        nothing more. The cheapest roll is always shown as the cheapest roll.
      </p>

      <h2>Later on</h2>
      <p>
        Running the site has small costs, so in future we may introduce some advertising to cover
        them. If and when we do, we'll update this page to say exactly what we're running — and it
        will <strong>never</strong> affect the rankings or the prices you see. Ordering by price,
        and never by payment, is the whole point of Filmproof.
      </p>
    </div>
  );
}
