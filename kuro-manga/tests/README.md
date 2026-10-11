# Reproduce checks

Use Node 22.13+ in the 22.x line:

~~~sh
npm ci --ignore-scripts
npm run build
npm test
~~~

The build command prepares and validates the supplied Expo export; it cannot
recompile the absent source tree. Default tests use a controlled local Supabase
transport and development SQLite. They never send real codes or contact Google.

To run all shared-state tests, start a **dedicated local Redis** on 127.0.0.1.
The test fixture requires a local server without credentials. It uses unique
test prefixes and deletes only its own keys. For example, with Redis on port 16379:

~~~powershell
$env:TEST_REDIS_URL="redis://127.0.0.1:16379"
npm test
~~~

All 35 tests run when that variable is set. Without it, 12 Redis/cross-process
cases are explicitly skipped. The real Supabase SDK runs against a local fixture;
production refuses the fixture's HTTP transport. Test codes and fixture secrets
exist only in tests/, which .vercelignore excludes.

For browser checks, start npm start in one terminal. In another:

~~~sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser-smoke.py
~~~

APP_URL defaults to http://localhost:8081. You can set it to another local test
server. PLAYWRIGHT_CHROMIUM_EXECUTABLE is optional if you use an existing Chromium.
Screenshots and a JSON report are saved under work/browser-evidence/.
The browser suite excludes external manga feeds, exercises the real compiled UI,
checks the install action both with and without a browser offer, and uses a
synthetic install event and OAuth handoff response. It does not claim real OS
installation, email/SMS delivery or a live Google consent exchange.
