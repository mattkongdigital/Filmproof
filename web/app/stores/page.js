import Link from 'next/link';
import { SITE_URL } from '../../lib/data';
import { STORES, storeFilmCount } from '../../lib/stores';
import { StoreLogo } from '../../components/store-logo';
import { Breadcrumbs } from '../../components/breadcrumbs';

export function generateMetadata() {
  return {
    title: 'Film shops we track | UK',
    description: 'The UK film shops and labs we track, independent stores, labs and camera specialists, with live stock and prices per roll.',
    alternates: { canonical: `${SITE_URL}/stores` },
  };
}

export default function StoresPage() {
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Stores' }]} />
      <header className="cat-head">
        <div className="eyebrow">The shops</div>
        <h1>Film shops we track</h1>
        <p className="cat-lede">
          Independent UK shops, labs and camera specialists — who they are, where they are, and how much
          of the film we track you can buy from them.
        </p>
      </header>
      <div className="store-grid">
        {STORES.map((s) => (
          <Link key={s.slug} href={`/store/${s.slug}`} className="store-card">
            <StoreLogo store={s} size="md" />
            <span className="store-card-name">{s.name}</span>
            <span className="store-card-town">{s.town}</span>
            <span className="store-card-count">{storeFilmCount(s.name)} films tracked</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
