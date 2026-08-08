import Link from 'next/link';
import { brandList } from '../../lib/facets';
import { SITE_URL } from '../../lib/data';
import { Breadcrumbs } from '../../components/breadcrumbs';

export function generateMetadata() {
  return {
    title: 'Film by brand — cheapest UK prices compared',
    description: 'Browse every film brand we track — Kodak, Ilford, Fujifilm, CineStill and more — with live UK prices.',
    alternates: { canonical: `${SITE_URL}/brands` },
  };
}

export default function BrandsPage() {
  const brands = brandList();
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Brands' }]} />
      <header className="cat-head">
        <div className="eyebrow">By brand</div>
        <h1>Film by brand</h1>
        <p className="lede">Every maker we track, most stocks first.</p>
      </header>
      <div className="brand-list">
        {brands.map((b) => (
          <Link key={b.slug} href={`/brand/${b.slug}`} className="brand-item">
            <span className="brand-name">{b.label}</span>
            <span className="brand-count">{b.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
