import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'About',
    description: 'What Filmproof is, why it exists, and who it\u2019s for — an independent UK film price comparison index.',
    alternates: { canonical: `${SITE_URL}/about` },
  };
}

export default function About() {
  return (
    <div className="wrap doc">
      <h1>About Filmproof</h1>
      <p className="lead">
        Filmproof is an independent price index for camera film in the UK. One page, many shops,
        the cheapest roll — so shooting film costs you a little less.
      </p>

      <h2>Why it exists</h2>
      <p>
        Film prices vary a lot from shop to shop, and they move around constantly. A roll that's
        cheapest at one shop this week might be dearer than three others the next. Checking that by
        hand — shop by shop, format by format — is tedious, so most people just don't, and quietly
        overpay. Filmproof does the checking for you: it gathers prices from UK film retailers
        every day and shows you where each stock is cheapest right now.
      </p>

      <h2>Who it's for</h2>
      <p>
        Anyone who shoots film — whether you're loading your first roll of Kodak Gold or buying
        Portra by the brick. It covers 35mm, 120, instant, large format and more, across colour,
        black &amp; white and slide, from the big names to the small independents.
      </p>

      <h2>Independent by design</h2>
      <p>
        Filmproof isn't owned by, or affiliated with, any shop or film manufacturer. Rankings are
        decided by price alone — no shop can pay to appear higher, and the links out to shops are
        plain and unpaid. You can read exactly how the site is run and funded in our{' '}
        <a href="/disclosure">advertising &amp; funding</a> and{' '}
        <a href="/how-it-works">how it works</a> pages.
      </p>

      <h2>Who's behind it</h2>
      <p>
        Filmproof is a personal project built and run by Matthew Kong, a film photographer. Got a
        correction, a shop we should add, or just want to say hello?{' '}
        <a href="/contact">Get in touch</a>.
      </p>
    </div>
  );
}
