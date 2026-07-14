# SafeGuard

## Install

```bash
bun install
python -m venv --system-site-packages .venv
.venv/bin/python -m pip install -r requirements.txt
```

## Run

```bash
bun run dev
```

This starts both the newspaper4k service and the Vite website in one terminal. Open the local URL
shown by Vite (normally `http://localhost:5173`) and select **Insights** in the navigation. Press
`Ctrl+C` once to stop both services.

On first launch, the page displays its curated articles while newspaper4k builds the live cache.
The label under the page introduction changes to `Live feed · extracted with newspaper4k` when the
live articles are ready. Later launches reuse the six-hour cache and normally load immediately.

The individual services can still be run separately for debugging:

```bash
bun run dev:news
bun run dev:web
```

The news service discovers and extracts wallet-security reporting from an allowlist of trusted
publishers. Results are cached for six hours in `backend/data/news-cache.json`; the frontend keeps
its curated built-in articles whenever the service is unavailable or is performing its first
refresh.

Useful environment variables:

- `NEWS_PORT` (default `8787`)
- `NEWS_CACHE_TTL_SECONDS` (default `21600`)
- `NEWS_RETRY_SECONDS` (default `300`)
- `NEWS_ARTICLES_PER_SOURCE` (default `2`)
- `NEWS_MAX_ARTICLES` (default `18`)
