import { notFound } from 'next/navigation';
import { brandList, filmsFor } from '../../../lib/facets';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { SITE_URL, brandLabel } from '../../../lib/data';

export function generateStaticParams() {
  return brandList().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }) {
  const label = brandLabel(params.slug);
  return {
    title: `${label} film — cheapest UK prices compared`,
    description: `Compare live UK prices on ${label} film, ranked cheapest per roll. Updated daily.`,
    alternates: { canonical: `${SITE_URL}/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const known = brandList().some((b) => b.slug === params.slug);
  if (!known) notFound();

  const label = brandLabel(params.slug);
  const films = filmsFor((f) => f.brand === params.slug);

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: 'Brands', href: '/brands' },
        { name: `${label} film` },
      ]} />
      <header className="cat-head">
        <div className="eyebrow">By brand</div>
        <h1>{label} film</h1>
        <p className="lede">
          Every {label} stock we track, ranked by the cheapest price per roll.
          {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
        </p>
      </header>

      <FilmBrowser films={films} />

    </div>
  );
}
