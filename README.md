# PackView

A lightweight packaging model viewer built with TanStack Start, React Three Fiber, Cloudflare R2, LibSQL, and Better Auth.

It lets users:
- sign in
- upload `.glb` / `.gltf` files
- view models in-browser with interactive controls
- browse recent uploads
- export screenshots

This project started from a TanStack Start template, but it is now a real product-shaped app rather than a starter scaffold.

---

## Features

### Model upload
- upload `.glb` and `.gltf` files
- file type validation
- file size validation (50MB limit)
- upload error feedback
- upload success feedback
- recent upload history refresh after upload

### 3D viewer
- interactive orbit view
- fit-to-model
- reset view
- environment presets
- wireframe toggle
- background / exposure / light controls
- model info panel
- screenshot export
- model loading progress UI
- model loading error recovery

### History
- recent uploaded models list
- loading state
- error state with retry
- select a prior model directly from history

### Auth and persistence
- Better Auth login/register flow
- LibSQL model metadata storage
- Cloudflare R2 object storage

---

## Tech stack

- **App framework:** TanStack Start
- **Routing:** TanStack Router
- **UI:** React 19
- **3D:** three.js, @react-three/fiber, @react-three/drei
- **Auth:** Better Auth
- **Database:** LibSQL
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

Create a local env file if you do not already have one.

Recommended variables:

```bash
BETTER_AUTH_SECRET=packview-dev-secret-change-in-prod
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

### 3. Start the app

```bash
npm run dev
```

Default local URL:

```bash
http://localhost:3000
```

---

## Environment notes

### Better Auth
This project currently uses a development fallback secret and base URL in code:

- `BETTER_AUTH_SECRET || 'packview-dev-secret-change-in-prod'`
- `BETTER_AUTH_URL || 'http://localhost:3000'`

That is convenient for local development, but you should set real values in production.

### Database
The app uses LibSQL with a simple environment-aware path strategy:

- local dev: `file:packview.db`
- production fallback: `file:/tmp/packview.db`
- if `/uploads` exists: `file:/uploads/packview.db`

The app also runs a simple startup migration for the `models` table.

### Cloudflare R2
Uploads require these variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

If these are missing, upload requests will fail with a configuration error message.

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
```

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm run test
```

Current test coverage includes:
- `HistoryPanel`
- `ViewerErrorBoundary`
- `DropZone`
- index route feedback / recovery flow

---

## API routes

This project uses TanStack Start API file routes.

Current internal API surface includes:
- `/api/upload`
- `/api/history`
- `/api/model/:id`
- Better Auth handler routes

The route files are named with a leading `-` so TanStack route scanning does not treat them like page routes.

---

## Current product behavior

### Upload flow
1. user selects a `.glb` / `.gltf` file
2. file is validated client-side
3. upload is sent to `/api/upload`
4. file is stored in R2
5. metadata is stored in LibSQL
6. viewer opens the uploaded model
7. recent history refreshes

### Viewer flow
- the landing page stays relatively light
- viewer modules are lazy-loaded when a model is opened
- the app shows loading progress, error states, screenshot feedback, and recovery actions

---

## Performance notes

A first round of lazy loading has already been applied:
- viewer shell is lazy-loaded
- canvas runtime is isolated behind a lazy boundary
- control panel and model viewer are split out

This significantly reduces landing-page cost, but the 3D runtime itself is still heavy once the viewer is opened. Further optimizations should focus on:
- deeper viewer-only splitting
- reducing 3D dependency cost where possible
- deferring optional viewer features

---

## Testing notes

Vitest runs in `jsdom` mode via `vitest.config.ts`.

The current tests focus on product behavior rather than trying to run the full real three.js stack in unit tests. For viewer-heavy flows, page tests mock the viewer shell and verify user-facing behavior instead.

---

## Production cautions

Before production, review these items carefully:
- replace development auth secret
- confirm `BETTER_AUTH_URL`
- review trusted origins in `src/lib/auth.ts`
- verify R2 credentials and bucket policy
- verify whether model files should be public or access-controlled
- review LibSQL file path strategy for your deployment target

---

## Suggested next steps

If you continue development, the highest-value next items are:

1. improve README / deployment docs further
2. expand automated tests
3. tighten auth and environment validation
4. refine viewer performance
5. add packaging-specific features like compare, annotation, or better export presets

---

## License / ownership

Private project.
