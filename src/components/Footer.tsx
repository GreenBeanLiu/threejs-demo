export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-16 px-4 py-8">
      <div className="page-wrap flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#56c6be,#2d9d8f)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M12 2L21 7.5v9L12 22 3 16.5v-9L12 2z"/>
              <path d="M12 2v20M3 7.5l9 5 9-5"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--sea-ink)]">PackView</span>
          <span className="text-sm text-[var(--sea-ink-soft)]">·</span>
          <span className="text-sm text-[var(--sea-ink-soft)]">3D Model Viewer</span>
        </div>
        <p className="text-xs text-[var(--sea-ink-soft)]">© {year} PackView. GLB / GLTF · up to 50 MB</p>
      </div>
    </footer>
  )
}
