import Link from 'next/link';
import { priceUnit } from '../lib/data';
import { OfferList } from './offer-list';

export function FilmFrame({ film, index, linked = true }) {
  return (
    <section className="frame">
      <div className="frame-inner">
        <div className="frame-head">
          <span className="frame-no">▸ {String(index + 1).padStart(2, '0')}A</span>
          <span className="frame-name">
            {linked ? <Link href={`/film/${film.slug}`} className="frame-name-link">{film.display}</Link> : film.display}
          </span>
          <span className="frame-spec">{film.format} · ISO {film.iso}</span>
        </div>
        <OfferList offers={film.offers} format={film.format} unit={priceUnit(film)} />
      </div>
    </section>
  );
}
