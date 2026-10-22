import { SITE_URL } from '../../lib/data';
import { STORES_ALPHABETICAL, storeFilmCount } from '../../lib/stores';
import { StoreDirectory } from '../../components/store-directory';
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
          Who the independent UK shops, labs and camera specialists are, where they are, and how much
          of the film we track you can buy from each. Some are photo labs too, and will develop the
          rolls you buy from them.
        </p>
      </header>
      <StoreDirectory
        stores={STORES_ALPHABETICAL.map((s) => ({ ...s, count: storeFilmCount(s.name) }))}
      />
    </div>
  );
}
