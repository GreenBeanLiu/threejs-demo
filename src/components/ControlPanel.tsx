import type { ModelInfo, ViewerSettings } from './ModelViewer'

const ENV_PRESETS: { key: ViewerSettings['environment']; label: string; icon: string }[] = [
  { key: 'studio', label: 'Studio', icon: '🎬' },
  { key: 'city', label: 'Daylight', icon: '🌤' },
  { key: 'warehouse', label: 'Showroom', icon: '🏪' },
  { key: 'sunset', label: 'Sunset', icon: '🌅' },
  { key: 'forest', label: 'Natural', icon: '🌿' },
  { key: 'night', label: 'Night', icon: '🌙' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-widest text-[var(--sea-ink-soft)] first:mt-0">
      {children}
    </p>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 text-sm">
      <span className="text-[var(--sea-ink)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#56c6be]' : 'bg-[var(--line)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-[var(--sea-ink)]">{label}</span>
        <span className="font-mono text-xs text-[var(--sea-ink-soft)]">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#56c6be]"
      />
    </div>
  )
}

interface ControlPanelProps {
  settings: ViewerSettings
  onChange: (patch: Partial<ViewerSettings>) => void
  modelInfo: ModelInfo | null
  fileName: string | null
  onFitToModel?: () => void
  onResetView?: () => void
}

export default function ControlPanel({
  settings,
  onChange,
  modelInfo,
  onFitToModel,
  onResetView,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col">
      <SectionTitle>View</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onFitToModel}
          className="rounded-xl bg-[var(--chip-bg)] px-3 py-2 text-xs font-medium text-[var(--sea-ink)] transition hover:bg-[rgba(86,198,190,0.08)]"
        >
          Fit model
        </button>
        <button
          type="button"
          onClick={onResetView}
          className="rounded-xl bg-[var(--chip-bg)] px-3 py-2 text-xs font-medium text-[var(--sea-ink)] transition hover:bg-[rgba(86,198,190,0.08)]"
        >
          Reset view
        </button>
      </div>

      <SectionTitle>Lighting Scene</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        {ENV_PRESETS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onChange({ environment: key })}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition ${
              settings.environment === key
                ? 'bg-[rgba(86,198,190,0.18)] text-[var(--sea-ink)] ring-1 ring-[#56c6be]'
                : 'bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:bg-[rgba(86,198,190,0.08)]'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <SectionTitle>Display</SectionTitle>
      <Toggle
        label="Auto Rotate"
        checked={settings.autoRotate}
        onChange={(value) => onChange({ autoRotate: value })}
      />
      <Toggle
        label="Wireframe"
        checked={settings.wireframe}
        onChange={(value) => onChange({ wireframe: value })}
      />
      <Toggle
        label="Ground Grid"
        checked={settings.showGrid}
        onChange={(value) => onChange({ showGrid: value })}
      />

      {settings.autoRotate && (
        <Slider
          label="Rotation Speed"
          value={settings.autoRotateSpeed}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(value) => onChange({ autoRotateSpeed: value })}
        />
      )}

      <SectionTitle>Appearance</SectionTitle>
      <Slider
        label="Brightness"
        value={settings.exposure}
        min={0.3}
        max={3}
        step={0.1}
        onChange={(value) => onChange({ exposure: value })}
      />
      <Slider
        label="Light Power"
        value={settings.lightIntensity}
        min={0}
        max={5}
        step={0.1}
        onChange={(value) => onChange({ lightIntensity: value })}
      />

      <div className="mt-2 flex items-center justify-between py-1">
        <span className="text-sm text-[var(--sea-ink)]">Background</span>
        <input
          type="color"
          value={settings.background}
          onChange={(e) => onChange({ background: e.target.value })}
          className="h-7 w-10 cursor-pointer rounded-lg border border-[var(--chip-line)]"
        />
      </div>

      {modelInfo && (
        <>
          <SectionTitle>Model Info</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ['Meshes', modelInfo.meshCount],
              ['Materials', modelInfo.materialCount],
              ['Textures', modelInfo.textureCount],
              ['Vertices', modelInfo.vertexCount.toLocaleString()],
              ['Triangles', modelInfo.triangleCount.toLocaleString()],
            ] as [string, string | number][]).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[var(--chip-bg)] px-3 py-2">
                <p className="text-[10px] text-[var(--sea-ink-soft)]">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-[var(--sea-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
