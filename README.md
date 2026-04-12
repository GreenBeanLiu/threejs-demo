# PackView

A packaging model viewer built with TanStack Start, React Three Fiber, Cloudflare R2, LibSQL, and Better Auth.

It supports:
- sign up / sign in
- upload `.glb` / `.gltf` files
- in-browser 3D preview
- recent upload history
- screenshot export

This project started from a TanStack Start template, but it now has a working end-to-end product flow.

---

## Current status

The main local flow is now working end to end:

- auth works
- upload works
- model fetch works
- history works
- build works
- tests pass

Verified locally:
1. register a user
2. create a session
3. upload a model to R2
4. fetch the uploaded model back through `/api/model/:id`
5. load recent history from `/api/history`

What is still mostly "project-quality" rather than "production-ready":
- viewer bundle size is still large
- env validation can be improved
- deployment docs are still thin
- auth/config hardening should be reviewed before production

---

## Features

### Model upload
- upload `.glb` and `.gltf` files
- file type validation
- file size validation (50MB limit)
- upload feedback and error handling
- recent upload history refresh after upload

### 3D viewer
- orbit controls
- fit-to-model
- reset view
- environment presets
- wireframe toggle
- background / exposure / light controls
- model info panel
- screenshot export
- loading progress UI
- error recovery UI

### History
- recent uploaded models list
- loading state
- error state with retry
- select a prior model from history

### Auth and persistence
- Better Auth email/password auth
- LibSQL local metadata storage
- Cloudflare R2 object storage for model files

---

## Tech stack

- **App framework:** TanStack Start
- **Routing:** TanStack Router
- **UI:** React 19
- **3D:** three.js, `@react-three/fiber`, `@react-three/drei`
- **Auth:** Better Auth
- **Database:** LibSQL for app data, SQLite/Kysely adapter path for Better Auth
- **Object storage:** Cloudflare R2 via AWS SDK
- **Styling:** Tailwind CSS v4
- **Tests:** Vitest + Testing Library

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root.

Minimal working example:

```env
BETTER_AUTH_SECRET=replace-with-a-random-string-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Notes:
- email/password auth works without Google/GitHub credentials
- upload requires all four R2 variables
- `.env.local` is ignored by git via `*.local`

### 3. Start the app

```bash
npm run dev
```

Default local URL:

```bash
http://localhost:3000
```

### 4. Useful checks

Run tests:

```bash
npm run test
```

Run production build:

```bash
npm run build
```

---

## Environment notes

### Better Auth

Local development currently expects:
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=http://localhost:3000`

If you do not set a secret, the app may still run in development, but you should always set a real secret for any serious environment.

Auth uses:
- Better Auth React client on the frontend
- TanStack Start server routes under `/api/auth/*`
- SQLite + Kysely adapter wiring for auth tables

### Database

The app uses an environment-aware local database path strategy:
- local dev: `file:packview.db`
- production fallback: `file:/tmp/packview.db`
- if `/uploads` exists: `file:/uploads/packview.db`

Startup migration now creates:
- Better Auth base tables: `user`, `session`, `account`, `verification`
- app table: `models`

`packview.db` is ignored by git.

### Cloudflare R2

Uploads require:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

If these are missing, upload requests fail with a configuration error.

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
```

---

## API routes

This project uses TanStack Start file routes for server endpoints.

Current API surface:
- `/api/auth/*`
- `/api/upload`
- `/api/history`
- `/api/model/:id`

Notes:
- API routes now use the current TanStack Start server route style
- older `createAPIFileRoute`-style files were removed

---

## Current product behavior

### Upload flow
1. user signs in
2. user selects a `.glb` / `.gltf` file
3. client validates file type and size
4. upload is sent to `/api/upload`
5. file is stored in R2
6. metadata is stored in local DB
7. viewer opens the uploaded model
8. recent history refreshes

### Viewer flow
- landing page stays lighter because viewer code is lazy-loaded
- model viewer loads only when needed
- viewer exposes progress, screenshot feedback, and recovery UI

### Auth flow
- sign-up creates user + session
- sign-in returns session cookie
- `/api/history` requires an authenticated session
- direct curl tests for sign-in should include an `Origin` header, or Better Auth may reject them with `MISSING_OR_NULL_ORIGIN`

---

## Performance notes

A first round of lazy loading is already in place:
- viewer shell is lazy-loaded
- canvas runtime is behind a lazy boundary
- control panel and viewer code are split

This helps landing-page performance, but the 3D runtime is still heavy after opening a model.

Good next targets:
- deeper viewer-only code splitting
- optional feature deferral
- reducing heavy 3D dependencies where possible

---

## Testing notes

Current unit/integration coverage includes:
- `HistoryPanel`
- `ViewerErrorBoundary`
- `DropZone`
- index route feedback / recovery behavior

Tests currently verify product behavior rather than trying to fully execute the real three.js runtime in unit tests.

---

## Production cautions

Before production, review these carefully:
- replace dev auth secrets
- confirm `BETTER_AUTH_URL`
- review trusted origins in `src/lib/auth.ts`
- verify R2 credentials and bucket permissions
- decide whether model files should be public, signed, or session-protected
- review local DB path strategy for your actual deployment target
- consider stronger env validation on boot

---

## Suggested next steps

High-value follow-up work:
1. tighten deployment / environment docs further
2. expand automated tests around auth + upload
3. improve viewer performance
4. improve env validation and startup errors
5. add packaging-specific features like compare, annotation, and export presets

---

## License / ownership

Private project.
