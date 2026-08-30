# Editorial content

Markdown posts, flat and one level deep:

    field-notes/<slug>.md  ->  /field-notes/<slug>/

The directory is the category. The filename is the slug — pick it carefully, it
is the URL and it should not change once the page is live.

The frontmatter contract, what `film` and `brand` have to resolve to, and how to
add a second silo are documented in `CLAUDE.md` at the repo root. The parser and
the build-time link check live in `web/lib/posts.js`.
