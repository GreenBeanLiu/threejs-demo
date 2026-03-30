import type { ViewerSettings, ModelInfo } from './ModelViewer'

const ENVS: ViewerSettings['environment'][] = ['city', 'studio', 'sunset', 'warehouse', 'forest', 'night']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="island-kicker mb-2 mt-4 first:mt-0">{children}</p>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span className="text-[var(--sea-ink-soft)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-[#56c6be]' : 'bg-[var(--line)]'
        }`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </label>
  )
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-[var(--sea-ink-soft)]">{label}</span>
        <span className="font-mono text-xs text-[var(--sea-ink)]">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#56c6be]"
      />
    </label>
  )
}

interface ControlPanelProps {
  settings: ViewerSettings
  onChange: (patch: Partial<ViewerSettings>) => void
  modelInfo: ModelInfo | null
  fileName: string | null
}

export default function ControlPanel({ settings, onChange, modelInfo, fileName }: ControlPanelProps) {
  return (
    <aside className="island-shell flex h-full flex-col gap-3 overflow-y-auto rounded-2xl p-4">
      {fileName && (
        <div className="rounded-xl bg-[var(--chip-bg)] px-3 py-2">
          <p className="truncate text-xs font-medium text-[var(--sea-ink)]" title={fileName}>{fileName}</p>
        </div>
      )}

      <SectionTitle>Environment</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {ENVS.map(env => (
          <button
            key={env}
            onClick={() => onChange({ environment: env })}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition ${
              settings.environment === env
                ? 'bg-[rgba(79,184,178,0.2)] text-[var(--sea-ink)] ring-1 ring-[#56c6be]'
                : 'bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:bg-[rgba(79,184,178,0.08)]'
            }`}
          >
            {env}
          </button>
        ))}
      </div>

      <SectionTitle>Display</SectionTitle>
      <div className="flex flex-col gap-2">
        <Toggle label="Wireframe" checked={settings.wireframe} onChange={v => onChange({ wireframe: v })} />
        <Toggle label="Auto Rotate" checked={settings.autoRotate} onChange={v => onChange({ autoRotate: v })} />
        <Toggle label="Show Grid" checked={settings.showGrid} onChange={v => onChange({ showGrid: v })} />
        <Toggle label="Show Axes" checked={settings.showAxes} onChange={v => onChange({ showAxes: v })} />
      </div>

      {settings.autoRotate && (
        <Slider label="Rotate Speed" value={settings.autoRotateSpeed} min={0.1} max={5} step={0.1} onChange={v => onChange({ autoRotateSpeed: v })} />
      )}

      <SectionTitle>Lighting</SectionTitle>
      <Slider label="Exposure" value={settings.exposure} min={0.1} max={3} step={0.05} onChange={v => onChange({ exposure: v })} />
      <Slider label="Light Intensity" value={settings.lightIntensity} min={0} max={5} step={0.1} onChange={v => onChange({ lightIntensity: v })} />

      <SectionTitle>Background</SectionTitle>
      <label className="flex items-center justify-between text-sm">
        <span className="text-[var(--sea-ink-soft)]">Color</span>
        <input
          type="color"
          value={settings.background}
          onChange={e => onChange({ background: e.target.value })}
          className="h-7 w-12 cursor-pointer rounded"
        />
      </label>

      {modelInfo && (
        <>
          <SectionTitle>Model Info</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['Meshes', modelInfo.meshCount],
              ['Materials', modelInfo.materialCount],
              ['Textures', modelInfo.textureCount],
              ['Vertices', modelInfo.vertexCount.toLocaleString()],
              ['Triangles', modelInfo.triangleCount.toLocaleString()],
            ] as [string, string | number][]).map(([label, val]) => (
              <div key={label} className="rounded-xl bg-[var(--chip-bg)] px-3 py-2">
                <p className="text-[10px] text-[var(--sea-ink-soft)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--sea-ink)]">{val}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  )
}
