/** @type {import('next').NextConfig} */

// On GitHub Project Pages the site is served under /<repo-name>/, so assets need
// a basePath. The workflow sets PAGES_BASE_PATH to the repo name automatically.
// If you use a custom domain (or a <user>.github.io site), leave it empty.
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  output: 'export',        // build to static HTML in web/out
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,     // nicer static URLs (/film/kodak-gold-200/)
};

export default nextConfig;
