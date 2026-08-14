import { SITE_URL } from '../../lib/data';

export function generateMetadata() {
  return {
    title: 'Terms of use',
    description: 'The terms on which Filmproof is provided.',
    alternates: { canonical: `${SITE_URL}/terms` },
  };
}

export default function Terms() {
  return (
    <div className="wrap doc">
      <h1>Terms of use</h1>
      <div className="updated">Last reviewed: 6 August 2026</div>

      <p className="lead">
        By using Filmproof you agree to these terms. They're meant to be fair and plain, the
        headline is simple: we work hard to be accurate, but always confirm a price with the shop
        before you buy.
      </p>

      <h2>What Filmproof is</h2>
      <p>
        Filmproof is a free price-comparison index for camera film sold by UK retailers, operated by
        Matthew Kong, a sole trader in England &amp; Wales. It shows prices read automatically from
        those shops' own catalogues and links you out to them. We don't sell film ourselves, and
        we're not a party to any purchase you make.
      </p>

      <h2>Accuracy</h2>
      <p>
        Prices, stock and specifications are gathered automatically and refreshed daily, but they
        can be out of date or occasionally wrong, and shops can change them at any time.{' '}
        <strong>The price and availability on the shop's own website always take precedence.</strong>{' '}
        Please check there before ordering. Filmproof is provided "as is", without warranties of
        any kind as to accuracy or completeness.
      </p>

      <h2>No liability for purchases</h2>
      <p>
        Your purchase is a contract between you and the shop, under the shop's own terms. Filmproof
        isn't responsible for the products, prices, delivery, returns or customer service of any
        shop, and to the extent permitted by law we accept no liability for any loss arising from
        your use of the site or from a purchase you make after following a link from it.
      </p>

      <h2>Advertising and links</h2>
      <p>
        At launch, outbound links to shops are plain and unpaid, we don't earn commission on them,
        and no shop can pay to affect its ranking. We may introduce advertising in future to cover
        running costs; if we do, it will never affect the price-based rankings. See our{' '}
        <a href="/disclosure">advertising &amp; funding</a> page.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Filmproof name, its design, and the original writing on the site are ours. Product
        names, brands and images belong to their respective owners and appear here only to identify
        products and compare prices. Product images in particular remain the property of the shops
        or manufacturers they come from, if you own one and would prefer it didn't appear, just{' '}
        <a href="/contact">let us know</a> and we'll take it down.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms, and any dispute arising from them or from your use of Filmproof, are governed
        by the law of England &amp; Wales.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms from time to time; the date above shows when they last changed.
        Questions? <a href="/contact">Contact us</a>.
      </p>
    </div>
  );
}
