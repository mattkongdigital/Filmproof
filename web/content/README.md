# Editorial content

Markdown posts for the three editorial silos. Flat, one level deep:

    guides/<slug>.md      ->  /guides/<slug>/
    field-notes/<slug>.md ->  /field-notes/<slug>/
    opinion/<slug>.md     ->  /opinion/<slug>/

The directory is the category. The filename is the slug — pick it carefully, it
is the URL and it should not change once the page is live.

The frontmatter contract, and what `film` and `brand` have to resolve to, is
documented in `CLAUDE.md` at the repo root. The parser and the build-time link
check live in `web/lib/posts.js`.
