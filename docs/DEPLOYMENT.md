# FragmentHub Deployment

> Phase：5 — GitHub / Vercel Integration  
> Architecture：ChatGPT → GitHub JSON ← FragmentHub Web

## 1. Runtime data flow

Production Web uses GitHub as the live data source when `FRAGMENTHUB_GITHUB_TOKEN` exists.

```text
FragmentHub Web
    ↓
authenticated API route
    ↓
server-side validation
    ↓
GitHub Contents API
    ↓
data/fragments/F-xxxxxx.json
```

After a successful write, Web reads GitHub directly, so the new Fragment is visible without waiting for a Vercel rebuild.

Without `FRAGMENTHUB_GITHUB_TOKEN`, local development falls back to the checked-out `data/fragments/` directory and Web save is disabled.

## 2. Required Vercel project

Import the private GitHub repository:

```text
EstherAIRP/FragmentHub
```

Recommended settings:

- Framework Preset：Next.js
- Root Directory：repository root
- Production Branch：main
- Node.js：20.9 or newer

No GitHub Actions deployment workflow is required. Use Vercel Git Integration.

## 3. Required environment variables

Production requires:

```text
FRAGMENTHUB_PASSWORD
FRAGMENTHUB_SESSION_SECRET
FRAGMENTHUB_GITHUB_TOKEN
```

Optional because defaults already exist:

```text
FRAGMENTHUB_GITHUB_REPOSITORY=EstherAIRP/FragmentHub
FRAGMENTHUB_GITHUB_BRANCH=main
```

### FRAGMENTHUB_PASSWORD

Private Web login password.

Store only in Vercel Environment Variables. Do not commit it.

### FRAGMENTHUB_SESSION_SECRET

Random session-signing secret. A suitable value can be generated locally with:

```bash
openssl rand -hex 32
```

### FRAGMENTHUB_GITHUB_TOKEN

Use a fine-grained GitHub token scoped to:

```text
EstherAIRP/FragmentHub
```

Minimum repository permission:

```text
Contents: Read and write
```

The token is server-side only and must not use a `NEXT_PUBLIC_` prefix.

## 4. Save flow

### Create

```text
Web form
→ Preview
→ Final confirm
→ POST /api/fragments
→ Allocate F-xxxxxx
→ Semantic validation
→ GitHub create
→ Redirect to Fragment Detail
```

### Update

```text
Web edit
→ Preview
→ Final confirm
→ PUT /api/fragments/[id]
→ compare expected_updated_at with GitHub
→ use current Content SHA
→ semantic validation
→ GitHub update
→ Redirect to Fragment Detail
```

If GitHub changed after the edit page was loaded, API returns HTTP 409 and does not overwrite the newer version.

## 5. Immutable fields

Web update cannot modify these fields even if a caller bypasses the UI:

- `id`
- `created_at`
- `original_input`
- `interview`
- `source`
- `ai`

These fields are restored from the current canonical GitHub Fragment on the server.

## 6. Data-only commits do not rebuild Vercel

A Web save creates a Git commit because GitHub is the Source of Truth.

Rebuilding Next.js for every Fragment would be wasteful, so `vercel.json` uses:

```text
scripts/vercel-ignore-build.sh
```

Behavior:

- only `data/fragments/**` or `generated/**` changed → exit 0 → Vercel ignores the build
- application/config/schema/docs changed → exit 1 → Vercel continues the build
- first deployment / missing previous SHA → build continues

This is safe because production pages read live Fragment data from GitHub instead of relying on build-time embedded data.

## 7. Authentication

Private routes are protected by the server layout.

Login uses an HttpOnly, SameSite=Strict cookie.

Save APIs independently verify authentication before performing GitHub writes.

Logout clears the session cookie.

## 8. Deployment verification checklist

After the first production deployment:

1. Opening `/` while logged out redirects to `/login`.
2. Invalid password stays logged out.
3. Valid password opens Dashboard.
4. Manual create shows a JSON preview before save.
5. Save creates `data/fragments/F-xxxxxx.json` in GitHub.
6. Detail page immediately shows the new Fragment.
7. Edit updates the same JSON file.
8. Editing an old version produces HTTP 409 instead of overwriting newer data.
9. Archive updates `status` to `archived`.
10. Logout returns to `/login`.
11. A data-only commit is ignored by Vercel deployment.
12. No `OPENAI_API_KEY` or model runtime exists in the Web project.

## 9. Build verification

Before production activation run:

```bash
npm install
npm run test
npm run typecheck
npm run build
```

`npm run build` runs data validation and index generation through `prebuild`.

## 10. External activation boundary

Repository implementation does not contain user secrets.

A production deployment cannot be activated until the Vercel project exists and the three required secret values are supplied by the account owner.
