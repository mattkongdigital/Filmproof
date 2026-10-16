// opportunities/sources.config.js
// Where the opportunities board looks for competitions, open calls and
// commissions. Adding a source is a new entry here; see "Adding an opportunity
// source" in CLAUDE.md for the checks to do first.
//
// Every source is a feed. `feeds` is tried in order and the first one that
// parses with at least one item wins. A source whose feeds all fail logs a
// warning and contributes nothing; it can't stop the run.
//
//   id        stable key, stored on every entry this source finds. Never rename.
//   name      shown in the review PR, not on the site
//   home      the listing page a human would browse, for the review PR
//   feeds     RSS/Atom URLs, first that works wins
//   itemPath  optional: the path every real item's URL starts with. Items
//             elsewhere are ignored, and a feed with none under it counts as
//             failed. This is the guard against a wrong feed URL that doesn't
//             look wrong — WordPress answers `/feed/?post_type=<type>` for a
//             type that doesn't exist with the site's MAIN feed, so a bad guess
//             would otherwise quietly read every news post.
//   film      'film-specific' when everything it lists is for film, otherwise
//             'general' — a hint for the reviewer, the extraction decides per item
//   prefilter true for a news source where opportunities are a small slice: an
//             item must mention one of PREFILTER_WORDS before it is worth reading

export const OPPORTUNITY_SOURCES = [
  {
    id: 'fast-forward',
    name: 'Fast Forward: Women in Photography',
    home: 'https://fastforward.photography/opportunities-category/commission/',
    // Its whole opportunities archive, jobs and fellowships included — the
    // extraction sets those aside.
    feeds: ['https://fastforward.photography/opportunities/feed/'],
    itemPath: '/opportunities/',
    film: 'general',
    prefilter: false,
  },
  {
    id: 'photo-networks-scotland',
    name: 'Photo Networks Scotland',
    home: 'https://photo-networks.scot/post-category/opportunities',
    feeds: [
      'https://photo-networks.scot/post-category/opportunities/feed/',
      'https://photo-networks.scot/post-category/open-call/feed/',
    ],
    film: 'general',
    prefilter: false,
  },
  {
    id: 'photoworks',
    name: 'Photoworks',
    home: 'https://photoworks.org.uk/opportunities/',
    // A custom post type with no archive feed; the itemPath check below is
    // what proves this is the opportunities feed and not the news one.
    feeds: ['https://photoworks.org.uk/feed/?post_type=opportunities'],
    itemPath: '/opportunities/',
    film: 'general',
    prefilter: false,
  },
  {
    id: 'kosmo-foto',
    name: 'Kosmo Foto',
    home: 'https://kosmofoto.com/',
    feeds: ['https://kosmofoto.com/feed/'],
    film: 'film-specific',
    prefilter: true,
  },
  {
    id: 'analog-forever',
    name: 'Analog Forever Magazine',
    home: 'https://www.analogforevermagazine.com/calls-for-entry',
    feeds: ['https://www.analogforevermagazine.com/calls-for-entry?format=rss'],
    film: 'film-specific',
    prefilter: false,
  },
];

// For `prefilter: true` sources. Matched case-insensitively against the item's
// title and body; one hit is enough. Deliberately broad — this only decides
// what gets read, not what gets listed.
export const PREFILTER_WORDS = [
  'competition', 'open call', 'call for entries', 'call for entry', 'submissions',
  'submit', 'award', 'prize', 'commission', 'deadline', 'enter',
];

// Sent with every request, so a site owner can see who is fetching and why.
export const USER_AGENT = 'FilmproofBot/1.0 (+https://filmproof.co.uk/opportunities/)';
