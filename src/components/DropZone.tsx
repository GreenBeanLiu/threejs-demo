import { useCallback, useEffect, useState } from 'react'
import {
  isSupportedModelFile,
  MAX_UPLOAD_BYTES,
  revokeObjectUrl,
  uploadModelFile,
} from '../lib/uploads'

interface DropZoneProps {
  onFile: (url: string, name: string, isProcessing?: boolean) => void
  onProcessing?: (isProcessing: boolean) => void
  onUploadComplete?: () => void
  signedIn?: boolean
  previewError?: string
}

export default function DropZone({
  onFile,
  onProcessing,
  onUploadComplete,
  signedIn = false,
  previewError = '',
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  useEffect(() => {
    if (!previewError) {
      return
    }

    setSuccessMessage('')
    setStatusMessage('')
    setErrorMessage('Upload finished, but the model could not be previewed. Please try another file.')
    onProcessing?.(false)
  }, [onProcessing, previewError])

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMessage('')
      setSuccessMessage('')
      setStatusMessage('')

      if (!isSupportedModelFile(file)) {
        setErrorMessage('Only GLB and GLTF files are supported.')
        return
      }

      if (file.size <= 0) {
        setErrorMessage('The selected file is empty.')
        return
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setErrorMessage('File is too large. Max size is 50MB.')
        return
      }

      onProcessing?.(true)
      setStatusMessage(`Preparing ${file.name}…`)

      const localUrl = URL.createObjectURL(file)
      onFile(localUrl, file.name, true)

      const uploadResult = await uploadModelFile(file)

      if ('error' in uploadResult) {
        revokeObjectUrl(localUrl)
        setStatusMessage('')
        setErrorMessage(uploadResult.error)
      } else {
        onFile(uploadResult.path, file.name, false)
        revokeObjectUrl(localUrl)
        setStatusMessage('')
        setSuccessMessage(`${file.name} is ready in the viewer.`)
        onUploadComplete?.()
      }

      onProcessing?.(false)
    },
    [onFile, onProcessing, onUploadComplete],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const onDragLeave = () => setDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex h-full w-full flex-col gap-3">
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)]">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-[#56c6be]">
            <path d="M16 3L29 10v12L16 29 3 22V10L16 3z"/>
            <path d="M16 3v26M3 10l13 7 13-7"/>
            <path d="M9.5 6.5L22.5 13.5"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-[var(--sea-ink)]">Drop a GLB / GLTF file here</p>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">or click to browse</p>
          <p className="mt-2 font-mono text-xs text-[var(--sea-ink-soft)] tracking-wide">.glb · .gltf · max 50 MB</p>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {signedIn ? 'Upload will save to your recent history automatically.' : 'Sign in first if you want uploads saved to your account history.'}
          </p>
        </div>
      </label>

      {statusMessage ? (
        <div className="msg msg-info">{statusMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="msg msg-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="msg msg-ok">{successMessage}</div>
      ) : null}
    </div>
  )
}
