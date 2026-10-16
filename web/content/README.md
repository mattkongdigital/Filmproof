# Editorial content

Markdown posts, flat and one level deep:

    field-notes/<slug>.md  ->  /field-notes/<slug>/

The directory is the category. The filename is the slug — pick it carefully, it
is the URL and it should not change once the page is live.

The frontmatter contract, what `film` and `brand` have to resolve to, and how to
add a second silo are documented in `CLAUDE.md` at the repo root. The parser and
the build-time link check live in `web/lib/posts.js`.

`opportunities.json` is the one file here that is not markdown. It is the
opportunities board's data, written by the weekly pipeline in `opportunities/`
and reviewed in a PR before it lands — edit it only to set `publish` or fill in
a field the pipeline left empty. See "Opportunities board" in `CLAUDE.md`.
