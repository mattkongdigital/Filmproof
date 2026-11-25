// industry-news/sources.config.js
// Where the weekly industry news round-up looks for film photography news: new
// and discontinued stocks, price changes, cameras, labs, manufacturers. Adding
// a source is a new entry here; see "Industry news" in CLAUDE.md for the
// checks to do first.
//
// Every source is a feed, read by fetch.js. Its pages are then read and
// summarised by a Claude session, so a site whose robots.txt turns away
// Anthropic's crawlers (ClaudeBot, anthropic-ai, Claude-Web, Claude-User) is
// not a source, whatever it allows FilmproofBot: fetch.js checks those agents
// too and skips the page. Kosmo Foto, Harman and The Phoblographer were left
// out for that reason when this list was made, and PetaPixel, Lomography and
// Ilford refuse automated requests outright.
//
//   id         stable key, stored in seen.json. Never rename.
//   name       shown on the site, beside each story's link
//   home       the site's front page, for the review PR
//   feeds      RSS/Atom URLs, first that works wins
//   prefilter  optional: words an item's title or text must contain one of
//              before it is worth reading. For a general photography site,
//              where film is a small share of what it publishes.

const FILM_WORDS = [
  'film stock', 'film camera', 'film photography', 'analogue', 'analog', '35mm film', '120 film',
  'emulsion', 'darkroom', 'kodak', 'ilford', 'harman', 'cinestill', 'lomography', 'foma',
  'portra', 'ektar', 'ektachrome', 'tri-x', 'instax', 'polaroid', 'half-frame', 'half frame',
];

export const INDUSTRY_SOURCES = [
  {
    id: 'japan-camera-hunter',
    name: 'Japan Camera Hunter',
    home: 'https://www.japancamerahunter.com/',
    feeds: ['https://www.japancamerahunter.com/feed/'],
  },
  {
    id: '35mmc',
    name: '35mmc',
    home: 'https://www.35mmc.com/',
    feeds: ['https://www.35mmc.com/feed/'],
  },
  {
    id: 'film-photography-project',
    name: 'Film Photography Project',
    home: 'https://filmphotographyproject.com/',
    feeds: ['https://filmphotographyproject.com/feed/'],
  },
  {
    id: 'amateur-photographer',
    name: 'Amateur Photographer',
    home: 'https://www.amateurphotographer.com/',
    feeds: ['https://www.amateurphotographer.com/feed/'],
    prefilter: FILM_WORDS,
  },
  {
    id: 'digital-camera-world',
    name: 'Digital Camera World',
    home: 'https://www.digitalcameraworld.com/',
    feeds: ['https://www.digitalcameraworld.com/feeds/all'],
    prefilter: FILM_WORDS,
  },
];

// The robots.txt agents a source must allow, besides our own. A Claude session
// reads every page this pipeline fetches, so a site's refusal of Anthropic's
// crawlers applies to it.
export const ANTHROPIC_AGENTS = ['claudebot', 'anthropic-ai', 'claude-web', 'claude-user'];
