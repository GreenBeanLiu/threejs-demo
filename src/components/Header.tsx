export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-between py-3 sm:py-4">
        <h1 className="m-0 text-base font-semibold tracking-tight">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2">
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            3D Viewer
          </span>
        </h1>
        <p className="m-0 hidden text-sm text-[var(--sea-ink-soft)] sm:block">
          Upload a GLB / GLTF model to explore it
        </p>
      </div>
    </header>
  )
}
