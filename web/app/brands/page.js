import { brandDirectory, topBrandsByListings } from '../../lib/facets';
import { SITE_URL } from '../../lib/data';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { BrandsDirectory } from '../../components/brands-directory';

export function generateMetadata() {
  return {
    title: 'Film by brand | Never run out, UK stock & prices',
    description: 'Browse every film brand we track, Kodak, Ilford, Fujifilm, CineStill and more, so you always know where to restock.',
    alternates: { canonical: `${SITE_URL}/brands` },
  };
}

export default function BrandsPage() {
  // Both lists are computed here, at build time, from the catalogue — so they
  // move with the daily rebuild and ship whole in the HTML.
  const groups = brandDirectory();
  const top = topBrandsByListings(5);
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Brands' }]} />
      <header className="cat-head">
        <div className="eyebrow">By brand</div>
        <h1>Film by brand</h1>
        <p className="lede">Every maker we track, A to Z, with the most widely stocked first.</p>
      </header>
      <BrandsDirectory groups={groups} top={top} />
    </div>
  );
}
