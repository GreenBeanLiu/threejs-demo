# TODO - threejs-learn

## Project snapshot

This is no longer just a Three.js demo.

It already has the shape of a real product:

- 3D model upload
- model viewer with orbit / environment / grid / axes / wireframe controls
- screenshot export
- upload history
- auth pages
- backend upload API
- model history API
- R2 storage
- LibSQL persistence

So the right next step is **not** “add more random Three.js tricks”.
The right next step is turning this from a promising prototype into a clean, reliable app.

---

## Highest priority

### 1. Fix project positioning and documentation
- [ ] Rewrite `README.md` to match the actual product
- [ ] Explain what the app does in one sentence
  - [ ] upload GLB / GLTF models
  - [ ] preview packaging models in browser
  - [ ] manage recent uploads
- [ ] Document the current stack
  - [ ] TanStack Start
  - [ ] React Three Fiber / Drei
  - [ ] Better Auth
  - [ ] LibSQL
  - [ ] Cloudflare R2
- [ ] Add local setup instructions
- [ ] Add required environment variables
- [ ] Add deployment notes

### 2. Fix obvious server/runtime issues
- [ ] Review `server.mjs` carefully
- [ ] Remove duplicated `port`, `__dirname`, and `clientDir` declarations
- [ ] Confirm the server file actually runs cleanly in its current form
- [ ] Add a quick smoke test for production boot
- [ ] Clean noisy debug logs or convert them into structured logs

### 3. Make upload flow trustworthy
- [ ] Add proper file validation on upload API
  - [ ] allow only `.glb` and `.gltf`
  - [ ] reject empty files
  - [ ] add max file size limit
- [ ] Return clear error messages for unsupported file types
- [ ] Handle upload failure in the UI instead of silently ignoring it
- [ ] Show upload state explicitly
  - [ ] uploading
  - [ ] success
  - [ ] failed
- [ ] If upload fails, decide whether local preview should remain visible or roll back

---

## Product improvements

### 4. Improve model viewer experience
- [ ] Add loading progress instead of only a generic loading overlay
- [ ] Show parse/load errors when a model cannot be rendered
- [ ] Add reset camera button
- [ ] Add fit-to-model button
- [ ] Add environment preset picker with labels users understand
- [ ] Add background presets instead of raw color-only workflow
- [ ] Improve screenshot UX
  - [ ] show confirmation after save
  - [ ] allow higher-resolution export

### 5. Improve history panel
- [ ] Add empty state copy
- [ ] Add delete/remove history items
- [ ] Add rename capability for uploaded models
- [ ] Add search or filter if history grows
- [ ] Add pagination or “load more” instead of hard limit 50
- [ ] Show upload date in addition to relative time

### 6. Improve landing/upload flow
- [ ] Make first screen more obviously actionable
- [ ] Explain supported formats and limits
- [ ] Add sample model for users with no file ready
- [ ] Add error state if user is not authenticated
- [ ] Add success feedback after upload completes

---

## Architecture and code quality

### 7. Untangle “demo code” from “real app code”
- [ ] Remove leftover template/demo language from the project
- [ ] Rename files/components where naming still feels generic or transitional
- [ ] Decide whether `threejs-learn` is still the right project name
- [ ] Rename branding text if product name is really “Packaging 3D Viewer” or something else

### 8. Clean up data/storage design
- [ ] Decide whether model metadata should include:
  - [ ] original filename
n  - [ ] MIME type
  - [ ] extension
  - [ ] upload status
  - [ ] thumbnail/screenshot path
- [ ] Add created/updated timestamps in a more extensible schema
- [ ] Add a proper migration path instead of implicit boot-time table creation only
- [ ] Decide whether LibSQL local file storage is enough for deployment targets

### 9. Improve backend boundaries
- [ ] Move storage logic behind a dedicated service module
- [ ] Move model repository/database queries behind a repository layer
- [ ] Centralize auth/session checks for API routes
- [ ] Standardize JSON error responses across all APIs
- [ ] Add request logging around upload/history/model fetch APIs

### 10. Security and environment hardening
- [ ] Fail fast when required env vars are missing
- [ ] Remove insecure development defaults before production
  - [ ] `BETTER_AUTH_SECRET`
  - [ ] fallback auth URLs
- [ ] Verify trusted origins list is correct and minimal
- [ ] Check whether uploaded files should be public or access-controlled
- [ ] Review model delivery path for access control leaks

---

## 3D-specific improvements

### 11. Make model inspection more useful
- [ ] Show richer model statistics
  - [ ] node count
  - [ ] mesh count
  - [ ] materials
  - [ ] textures
  - [ ] triangle count
- [ ] Detect oversized/heavy models and warn users
- [ ] Add performance guidance for large assets
- [ ] Add bounding box dimensions if meaningful for packaging work
- [ ] Add model center / scale normalization if needed

### 12. Improve rendering quality controls
- [ ] Add tone mapping options
- [ ] Add shadow quality toggle
- [ ] Add antialias/performance toggle
- [ ] Add light rig presets
- [ ] Consider postprocessing only if it adds real value

### 13. Support more realistic packaging workflows
- [ ] Allow texture swap / label swap for packaging mockups
- [ ] Add turntable animation export (GIF/video later)
- [ ] Add annotation hotspots on models
- [ ] Add variant comparison mode
- [ ] Add side-by-side compare for two models

---

## Reliability and testing

### 14. Add tests for critical logic
- [ ] Upload API validation tests
- [ ] Auth-required API tests
- [ ] History API tests
- [ ] Model path resolution tests
- [ ] Basic component tests for upload/history states
- [ ] Smoke test that viewer page renders without model loaded

### 15. Add error handling in the UI
- [ ] Show upload errors in `DropZone`
- [ ] Show history loading errors in `HistoryPanel`
- [ ] Show model loading/rendering errors in viewer
- [ ] Avoid silent failures where the UI simply does nothing

### 16. Add observability basics
- [ ] Add structured logs for uploads
- [ ] Log upload duration and file size
- [ ] Log model fetch failures
- [ ] Make it easy to trace one uploaded model end-to-end

---

## Nice follow-up features

### 17. User/account features
- [ ] Add logout flow if missing in UI
- [ ] Add profile/account page
- [ ] Add per-user quotas or limits if needed
- [ ] Add email verification / password reset if this becomes real product

### 18. Collaboration features
- [ ] Add shareable preview links
- [ ] Add public/private model visibility control
- [ ] Add team workspace support if product direction requires it

### 19. Media/export features
- [ ] Add poster image generation for each model
- [ ] Add multiple screenshot presets
- [ ] Add transparent background export
- [ ] Add batch export if users compare variants often

---

## Suggested implementation order

### Phase A - clean up the foundation
- [ ] Rewrite README
- [ ] Fix `server.mjs`
- [ ] Add upload validation and proper UI error handling
- [ ] Clean up env/config handling

### Phase B - improve the core product
- [ ] Better loading/error states
- [ ] Better history panel
- [ ] Camera reset / fit controls
- [ ] Better screenshot/export flow

### Phase C - make it robust
- [ ] Add tests
- [ ] Add structured logging
- [ ] Refactor storage/db/auth boundaries

### Phase D - add product differentiation
- [ ] Packaging-specific inspection tools
- [ ] variant compare
- [ ] share/export features

---

## My blunt take

The most valuable next move is **not adding more Three.js effects**.

The best next step is:

**clean up the upload-to-view pipeline so it feels reliable, documented, and production-shaped.**

If I were continuing this project, I would do these first:

1. fix `server.mjs`
2. rewrite `README.md`
3. add upload validation + error handling
4. add camera reset / fit + better loading states
