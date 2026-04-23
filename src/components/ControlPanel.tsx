import type { ModelInfo, ViewerSettings } from './ModelViewer'

const ENV_PRESETS: { key: ViewerSettings['environment']; label: string; icon: string }[] = [
  { key: 'studio', label: 'Studio', icon: '🎬' },
  { key: 'city', label: 'Daylight', icon: '🌤' },
  { key: 'warehouse', label: 'Showroom', icon: '🏪' },
  { key: 'sunset', label: 'Sunset', icon: '🌅' },
  { key: 'forest', label: 'Natural', icon: '🌿' },
  { key: 'night', label: 'Night', icon: '🌙' },
]

function PanelSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-white/42">{hint}</p> : null}
      </div>
      {children}
    </section>
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
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm text-white/88 transition hover:bg-white/[0.03]">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#56c6be]' : 'bg-white/14'
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
    <div className="rounded-xl px-2 py-2 transition hover:bg-white/[0.03]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-white/86">{label}</span>
        <span className="font-mono text-xs text-white/45">{value.toFixed(1)}</span>
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
  fileName,
  onFitToModel,
  onResetView,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <PanelSection title="Workspace" hint="Primary camera actions for review.">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onFitToModel}
            className="rounded-xl border border-white/8 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/88 transition hover:border-[#56c6be]/40 hover:bg-[#56c6be]/10"
          >
            Fit model
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="rounded-xl border border-white/8 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/88 transition hover:border-[#56c6be]/40 hover:bg-[#56c6be]/10"
          >
            Reset view
          </button>
        </div>
      </PanelSection>

      <PanelSection title="Lighting" hint="Use environment presets to review material response.">
        <div className="grid grid-cols-2 gap-2">
          {ENV_PRESETS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onChange({ environment: key })}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                settings.environment === key
                  ? 'border-[#56c6be]/45 bg-[#56c6be]/14 text-white'
                  : 'border-white/8 bg-white/[0.04] text-white/58 hover:bg-white/[0.07]'
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Display" hint="Quick render toggles for inspection.">
        <div className="space-y-0.5">
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
            label="White Model"
            checked={settings.whiteModel}
            onChange={(value) => onChange({ whiteModel: value })}
          />
          <Toggle
            label="Flat Shading"
            checked={settings.flatShading}
            onChange={(value) => onChange({ flatShading: value })}
          />
          <Toggle
            label="Ground Grid"
            checked={settings.showGrid}
            onChange={(value) => onChange({ showGrid: value })}
          />
        </div>
      </PanelSection>

      <PanelSection title="Exposure" hint="Fine tune the viewer stage without leaving review mode.">
        <div className="space-y-1">
          {settings.autoRotate ? (
            <Slider
              label="Rotation Speed"
              value={settings.autoRotateSpeed}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(value) => onChange({ autoRotateSpeed: value })}
            />
          ) : null}
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
          <div className="mt-1 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.03]">
            <span className="text-sm text-white/86">Background</span>
            <input
              type="color"
              value={settings.background}
              onChange={(e) => onChange({ background: e.target.value })}
              className="h-8 w-11 cursor-pointer rounded-lg border border-white/12 bg-transparent"
            />
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Model Info" hint="Quick geometry summary for the current asset.">
        {modelInfo ? (
          <div className="grid grid-cols-2 gap-2">
            {([
              ['Format', modelInfo.format.toUpperCase()],
              ['Meshes', modelInfo.meshCount],
              ['Materials', modelInfo.materialCount],
              ['Textures', modelInfo.textureCount],
              ['Vertices', modelInfo.vertexCount.toLocaleString()],
              ['Triangles', modelInfo.triangleCount.toLocaleString()],
            ] as [string, string | number][]).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-white/92">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-white/48">
            <p className="font-medium text-white/84">{fileName ?? 'No model selected yet'}</p>
            <p className="mt-1 text-xs leading-5">
              Upload a GLB or GLTF file to inspect geometry counts, materials, textures, and preview settings here.
            </p>
          </div>
        )}
      </PanelSection>
    </div>
  )
}
