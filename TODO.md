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
- Viewer workspace v1 shipped: focused toolbar, dominant canvas stage, and tool-style right panel
- Wireframe now renders as line-only
- Loading overlay is scoped to the viewer area instead of the whole page

So the next work should **not** be random polish or more one-off Three.js toggles.
The next work should be closing the most important product-shaped gaps in a deliberate order.

---

## Highest priority now

### 1. Rewrite README to match the actual product
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

### 2. Clean backend/config assumptions after the Postgres migration
- [ ] Remove stale LibSQL / SQLite wording from docs and comments
- [ ] Review env handling for fail-fast behavior
  - [ ] DATABASE_URL
  - [ ] BETTER_AUTH_SECRET
  - [ ] BETTER_AUTH_URL
  - [ ] R2 variables
- [ ] Reduce insecure development fallbacks before production hardening
- [ ] Review trusted origins list and keep it minimal

---

## Next product closures after docs/config cleanup

### 3. Improve viewer inspection quality
- [ ] white model should feel intentional, not just a color flip
- [ ] flat shading should be visually clean
- [ ] add richer model inspection info
  - [ ] node count
  - [ ] bounding box / dimensions if useful
  - [ ] heavy model warnings
- [ ] add better background presets instead of raw color-only workflow

### 4. Improve model/history workflow
- [ ] add upload date in history
- [ ] add delete/remove history items
- [ ] add rename capability for uploaded models
- [ ] add search or filtering if history grows

### 5. Improve screenshot/export workflow
- [ ] stronger confirmation after save
- [ ] higher-resolution export option
- [ ] transparent background export if valuable

---

## Reliability and architecture follow-up

### 6. Add tests around critical backend paths
- [ ] upload API validation tests
- [ ] auth-required API tests
- [ ] history API tests
- [ ] model path resolution tests

### 7. Improve backend boundaries
- [ ] move storage logic behind a dedicated service module
- [ ] move model queries behind a repository layer
- [ ] standardize JSON error responses
- [ ] add request logging for upload/history/model fetch

### 8. Add a real migration strategy
- [ ] stop relying only on implicit boot-time table creation
- [ ] define explicit schema evolution for auth + models tables

---

## Nice follow-up features

### 9. Packaging-specific features
- [ ] texture / label swap workflows
- [ ] annotation hotspots
- [ ] compare mode for variants
- [ ] shareable preview links

---

## Current recommended implementation order

### Phase A
- [ ] rewrite README
- [ ] clean env/config assumptions after Postgres migration

### Phase B
- [ ] improve inspection quality
- [ ] improve history workflow
- [ ] improve screenshot/export

### Phase C
- [ ] add backend tests
- [ ] add repository/service boundaries
- [ ] add explicit migration strategy

### Phase D
- [ ] packaging-specific features if product needs them

---

## Blunt take

The highest-value next closure is now:

**Rewrite README to match the actual shipped product**

Not because the viewer still needs its workspace shell, but because the roadmap and documentation should now reflect the product that already shipped.
