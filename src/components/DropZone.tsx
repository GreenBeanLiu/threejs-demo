import { useCallback, useState } from 'react'

interface DropZoneProps {
  onFile: (url: string, name: string, isProcessing?: boolean) => void
  onProcessing?: (isProcessing: boolean) => void
}

async function uploadToServer(file: File): Promise<string | null> {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json() as { path: string }
    return data.path
  } catch {
    return null
  }
}

export default function DropZone({ onFile, onProcessing }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) return

    // Signal that we are processing
    onProcessing?.(true)

    // Use local object URL immediately for fast preview
    const localUrl = URL.createObjectURL(file)
    onFile(localUrl, file.name, true)

    // Upload and wait for completion to clear processing state
    await uploadToServer(file)
    onProcessing?.(false)
  }, [onFile, onProcessing])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <label
      className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-colors ${
        dragging
          ? 'border-[#56c6be] bg-[rgba(79,184,178,0.08)]'
          : 'border-[var(--line)] bg-[var(--chip-bg)] hover:border-[#56c6be] hover:bg-[rgba(79,184,178,0.04)]'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        accept=".glb,.gltf"
        className="sr-only"
        onChange={onInputChange}
      />
      <div className="text-5xl">📦</div>
      <div className="text-center">
        <p className="text-base font-semibold text-[var(--sea-ink)]">Drop a GLB / GLTF file here</p>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">or click to browse</p>
      </div>
    </label>
  )
}
