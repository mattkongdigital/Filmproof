import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_URL } from '../../../lib/data';
import { weekNews, newsWeeks, newsWeekParams } from '../../../lib/news';
import { WEEK_SLUG, displayWeek } from '../../../lib/news-format.mjs';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { NewsFeed } from '../../../components/news-feed';

// One page per ISO week, /news/2026-w48/. The slug is the week, so an item's
// archive address is known the day it is posted and never moves.
export const dynamicParams = false;

export function generateStaticParams() {
  return newsWeekParams();
}

export function generateMetadata({ params }) {
  const items = weekNews(params.week);
  return {
    title: `Film news, ${displayWeek(params.week)}`,
    description: `What changed at UK film shops in the week of ${displayWeek(params.week)}: newly listed films, restocks and lower prices.`,
    alternates: { canonical: `${SITE_URL}/news/${params.week}` },
    ...(items.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function NewsWeekPage({ params }) {
  if (!WEEK_SLUG.test(params.week)) notFound();
  const items = weekNews(params.week);
  // Neighbours among the weeks that have something in them, so the links never
  // lead to an empty page.
  const weeks = newsWeeks();
  const i = weeks.indexOf(params.week);
  const newer = i > 0 ? weeks[i - 1] : null;
  const older = i >= 0 ? weeks[i + 1] || null : weeks.find((w) => w < params.week) || null;
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'News', href: '/news/' }, { name: displayWeek(params.week) }]} />
      <header className="cat-head">
        <div className="eyebrow"><Link href="/news/">News</Link></div>
        <h1>{displayWeek(params.week)}</h1>
        <p className="lede">
          Everything posted to the news feed in this week, as it was posted. Prices and stock will have
          moved since, so a film&apos;s own page has today&apos;s.
        </p>
      </header>
      <NewsFeed items={items} empty="Nothing was posted in this week." />
      <nav className="news-pager" aria-label="Other weeks">
        {older ? <Link href={`/news/${older}/`}>← {displayWeek(older)}</Link> : <span />}
        {newer ? <Link href={`/news/${newer}/`}>{displayWeek(newer)} →</Link> : <Link href="/news/">Latest news →</Link>}
      </nav>
    </div>
  );
}
