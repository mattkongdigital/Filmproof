import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'How it works',
    description: 'How Filmproof sources film prices, how often they update, and how the cheapest-per-roll comparison is worked out.',
    alternates: { canonical: `${SITE_URL}/how-it-works` },
  };
}

export default function HowItWorks() {
  return (
    <div className="wrap doc">
      <h1>How it works</h1>
      <p className="lead">
        Filmproof compares the price of camera film across UK shops so you can find the
        cheapest roll without opening a dozen tabs. Here's exactly how the numbers are put together.
      </p>

      <h2>Where the prices come from</h2>
      <p>
        Prices are read automatically from each shop's own live online catalogue — the same
        prices you'd see on their website. Nothing is typed in by hand, and nothing is estimated.
        If a shop lists a film at a given price, that's the price you'll see here.
      </p>

      <h2>How often they update</h2>
      <p>
        The whole catalogue is rebuilt automatically once a day, so prices and stock are
        refreshed daily. Even so, shops change prices whenever they like — so treat a price here
        as a very recent snapshot, not a live guarantee. <strong>Always confirm the price on the
        shop's own page before you buy.</strong>
      </p>

      <h2>What "cheapest per roll" means</h2>
      <p>
        Every price is worked out <strong>per roll</strong>. Where a shop only sells a film in a
        multipack — a five-pack, say — the pack price is divided down to a single roll, so a
        five-pack and a single roll can be compared fairly side by side. The pack size is shown
        on the offer so you know what you're actually buying.
      </p>

      <h2>What's included — and what isn't</h2>
      <ul>
        <li>Prices are shop <strong>list prices</strong> as published.</li>
        <li>Loyalty points, account discounts, and basket or checkout offers are <strong>not</strong> included.</li>
        <li>Delivery costs are <strong>not</strong> included — they vary by shop, basket size and location.</li>
        <li>The cheapest <strong>in-stock</strong> price is highlighted; out-of-stock offers are shown but marked.</li>
      </ul>

      <h2>Why some films show a dash or "check price"</h2>
      <p>
        Shops don't all publish the same detail. When a shop doesn't make a price or stock status
        available in a way we can read reliably, we show a dash rather than guess. The same goes
        for specifications like ISO or exposure count — if it isn't clearly stated, we leave it
        blank rather than invent it. Correct-but-incomplete beats confident-but-wrong.
      </p>

      <h2>How the same film is matched across shops</h2>
      <p>
        To compare a film across shops, we have to recognise that "Kodak Gold 200" at one shop is
        the same film as "Kodak GOLD 200 35mm" at another. This is done automatically from the
        product names, which is reliable for the mainstream films most people buy, but isn't
        perfect for every obscure or oddly-named stock. A 24-exposure and a 36-exposure roll are
        treated as separate options, and expired film is kept separate from fresh, because those
        are genuinely different things to buy. If you spot a film matched wrongly, please{' '}
        <a href="/contact">tell us</a> — it helps.
      </p>

      <h2>How shops are ordered</h2>
      <p>
        Offers are ranked purely by price per roll, cheapest first. <strong>No shop can pay to
        rank higher.</strong> The links out to shops are plain, unpaid links — we don't earn a
        commission on them. See our <a href="/disclosure">advertising &amp; funding</a> page for
        how the site is paid for.
      </p>
    </div>
  );
}
