# TODO - PackView / threejs-learn

## Current product state

PackView is no longer an early Three.js demo.

Current verified baseline:
- Railway production is back online
- Node server deployment is working
- App/auth database moved to PostgreSQL
- Better Auth email + Google sign-in works
- Upload works
- History works
- Model fetch works
- Viewer works with lighting / grid / axes / wireframe / screenshot
- Wireframe now renders as line-only
- Loading overlay is scoped to the viewer area instead of the whole page

So the next work should **not** be random polish or more one-off Three.js toggles.
The next work should be closing the most important product-shaped gaps in a deliberate order.

---

## Highest priority now

### 1. Viewer workspace v1
Goal: turn the current viewer from “a page with a canvas and settings” into a focused review workspace.

#### Acceptance skeleton
- [ ] Viewer uses a clear 3-part layout
  - [ ] lightweight top toolbar
  - [ ] dominant canvas stage
  - [ ] tool-style right panel
- [ ] Top toolbar is thin and utility-like
  - [ ] file name
  - [ ] concise status
  - [ ] back action
- [ ] Canvas is the visual main area
- [ ] Loading / error / retry / screenshot feedback all belong to the canvas layer
- [ ] Right panel feels like viewer tools, not a generic web form sidebar
- [ ] Overall viewer feels like a workspace, not a landing-page extension

#### Explicitly out of scope for v1
- [ ] white model improvements
- [ ] flat shading improvements
- [ ] OBJ / STL support
- [ ] deeper auth work
- [ ] landing page redesign

---

### 2. Rewrite README to match the actual product
- [ ] Explain PackView in one sentence
- [ ] Describe the real current product surface
  - [ ] upload GLB / GLTF
  - [ ] review packaging models in browser
  - [ ] manage recent uploads
  - [ ] auth + history + screenshots
- [ ] Document the real stack
  - [ ] TanStack Start
  - [ ] React Three Fiber / Drei
  - [ ] Better Auth
  - [ ] PostgreSQL
  - [ ] Cloudflare R2
- [ ] Add local setup instructions
- [ ] Add required environment variables
- [ ] Add Railway deployment notes

---

### 3. Clean backend/config assumptions after the Postgres migration
- [ ] Remove stale LibSQL / SQLite wording from docs and comments
- [ ] Review env handling for fail-fast behavior
  - [ ] DATABASE_URL
  - [ ] BETTER_AUTH_SECRET
  - [ ] BETTER_AUTH_URL
  - [ ] R2 variables
- [ ] Reduce insecure development fallbacks before production hardening
- [ ] Review trusted origins list and keep it minimal

---

## Next product closures after workspace v1

### 4. Improve viewer inspection quality
- [ ] white model should feel intentional, not just a color flip
- [ ] flat shading should be visually clean
- [ ] add richer model inspection info
  - [ ] node count
  - [ ] bounding box / dimensions if useful
  - [ ] heavy model warnings
- [ ] add better background presets instead of raw color-only workflow

### 5. Improve model/history workflow
- [ ] add upload date in history
- [ ] add delete/remove history items
- [ ] add rename capability for uploaded models
- [ ] add search or filtering if history grows

### 6. Improve screenshot/export workflow
- [ ] stronger confirmation after save
- [ ] higher-resolution export option
- [ ] transparent background export if valuable

---

## Reliability and architecture follow-up

### 7. Add tests around critical backend paths
- [ ] upload API validation tests
- [ ] auth-required API tests
- [ ] history API tests
- [ ] model path resolution tests

### 8. Improve backend boundaries
- [ ] move storage logic behind a dedicated service module
- [ ] move model queries behind a repository layer
- [ ] standardize JSON error responses
- [ ] add request logging for upload/history/model fetch

### 9. Add a real migration strategy
- [ ] stop relying only on implicit boot-time table creation
- [ ] define explicit schema evolution for auth + models tables

---

## Nice follow-up features

### 10. Packaging-specific features
- [ ] texture / label swap workflows
- [ ] annotation hotspots
- [ ] compare mode for variants
- [ ] shareable preview links

---

## Current recommended implementation order

### Phase A
- [ ] close Viewer workspace v1

### Phase B
- [ ] rewrite README
- [ ] clean env/config assumptions after Postgres migration

### Phase C
- [ ] improve inspection quality
- [ ] improve history workflow
- [ ] improve screenshot/export

### Phase D
- [ ] add backend tests
- [ ] add repository/service boundaries
- [ ] add explicit migration strategy

---

## Blunt take

The highest-value next closure is still:

**Viewer workspace v1**

Not because the viewer is broken, but because it still does not yet feel like a focused professional review tool.
