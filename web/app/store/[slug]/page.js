import { notFound } from 'next/navigation';
import { SITE_URL } from '../../../lib/data';
import { STORES, getStore, filmsForStore } from '../../../lib/stores';
import { StoreLogo } from '../../../components/store-logo';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';

export function generateStaticParams() {
  return STORES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const store = getStore(params.slug);
  if (!store) return {};
  return {
    title: `${store.name} — film stock & prices`,
    description: `${store.name} in ${store.town} — see the film they stock, with live prices per roll. Updated daily.`,
    alternates: { canonical: `${SITE_URL}/store/${store.slug}` },
  };
}

export default function StorePage({ params }) {
  const store = getStore(params.slug);
  if (!store) notFound();

  const films = filmsForStore(store.name);

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: 'Stores', href: '/stores' },
        { name: store.name },
      ]} />

      <header className="store-head">
        <StoreLogo store={store} size="lg" />
        <div className="store-meta">
          <h1>{store.name}</h1>
          <div className="store-town">{store.town}</div>
          <a className="store-visit" href={store.url} target="_blank" rel="noopener noreferrer">Visit shop →</a>
        </div>
      </header>

      <p className="store-desc">{store.description}</p>

      {films.length > 0 ? (
        <>
          <h2 className="store-films-head">Film {store.name} carries</h2>
          <FilmBrowser films={films} />
        </>
      ) : (
        <p className="empty">No film from {store.name} in the catalogue right now.</p>
      )}
    </div>
  );
}
