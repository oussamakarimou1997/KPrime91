# KPrime91 — Cloudflare Workers + D1

This version keeps the React/Vite application and moves persistent application data to Cloudflare D1. Chat persistence is intentionally not included. The initial D1 seed preserves the supplied backup records (122 perfumes, 2 mixing-history records, 4 salesmen, and the 8 settings values).

## Important safety notes

- Do not delete the existing Cloudflare project or its current database before verifying this deployment.
- The seed migration uses `INSERT OR IGNORE`; re-running it will not overwrite records that have since been edited in D1.
- The frontend keeps a local browser cache for responsiveness, but D1 is the durable source after the first successful sync.
- Protect the Worker/site with **Cloudflare Access** (allow only your own email). The API is intended for one owner and does not implement multi-user accounts. Do not expose the write API publicly.
- Gemini API keys belong in Worker secrets, never in frontend `.env` files or source control.

## 1. Install and configure

```bash
npm install
npx wrangler login
npx wrangler d1 create kprime91-db
```

Copy the `database_id` returned by the last command into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

## 2. Create the D1 tables and import the backup

The migrations directory contains:
- `0001_initial.sql` — creates the D1 tables.
- `0002_backup_seed.sql` — imports the supplied backup without replacing existing rows.

Run:

```bash
npx wrangler d1 migrations apply kprime91-db --remote
```

Do this once before publishing the new Worker. The seed migration is idempotent and does not erase or replace existing records.

## 3. Add the Gemini key (for PDF AI parsing and AI research fallback)

```bash
npx wrangler secret put GEMINI_API_KEY
```

Paste your Google AI Studio API key into the hidden prompt. The application also supports deterministic/local parsing when the key is absent, but Gemini-powered parsing/research will not work without it.

## 4. Build and deploy

```bash
npm run build
npx wrangler deploy
```

The Worker serves the Vite `dist` assets and handles `/api/*` requests. The D1 binding name is `DB` and the static-assets binding is `ASSETS`.

## 5. Verify

Open `https://YOUR-WORKER-URL/api/health`. It should report `status: "ok"` and `storage: "Cloudflare D1"`.

Then open the app and verify the Perfume Database, Mixing History, Sales Team, Settings, PDF import, and Similar Perfume features. Check that the perfume count starts at 122 and the mixing history starts at 2. Do not use any “reset to defaults” option during migration.

## Local development

```bash
npm run dev
```

This project still has the original Express `server.ts` for local legacy development. The Cloudflare production entry point is `worker/index.ts`; deploy using `wrangler`, not `npm start`.
