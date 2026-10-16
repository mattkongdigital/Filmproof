// opportunities/proxy.js — import first, before anything that fetches.
// The weekly run happens in a cloud environment whose traffic goes out through
// HTTPS_PROXY, and Node's built-in fetch ignores that variable unless
// NODE_USE_ENV_PROXY=1 is set (Node 22.21+). Without it every feed fails with
// a bare "fetch failed". So when a proxy is configured and the flag isn't, the
// script re-runs itself with the flag rather than relying on whoever starts it
// to know. With no proxy in the environment this does nothing.

import { spawnSync } from 'node:child_process';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && process.env.NODE_USE_ENV_PROXY !== '1') {
  const run = spawnSync(process.execPath, ['--no-warnings=UNDICI-EHPA', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(run.status ?? 1);
}
