export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function revokeObjectUrl(url: string | null | undefined) {
  if (!url?.startsWith('blob:')) {
    return
  }

  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

export function isSupportedModelFile(file: File) {
  return /\.(glb|gltf)$/i.test(file.name)
}

export function formatUploadError(message: string) {
  if (!message.trim()) {
    return 'Upload failed'
  }

  return message
}

export async function uploadModelFile(
  file: File,
): Promise<{ path: string; id?: string; name?: string; size?: number; uploadedAt?: string } | { error: string }> {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = (await res.json().catch(() => null)) as
      | { path?: string; id?: string; name?: string; size?: number; uploadedAt?: string; error?: string }
      | null

    if (!res.ok || !data?.path) {
      return {
        error: formatUploadError(data?.error ?? `Upload failed with HTTP ${res.status}`),
      }
    }

    return {
      path: data.path,
      id: data.id,
      name: data.name,
      size: data.size,
      uploadedAt: data.uploadedAt,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? formatUploadError(error.message) : 'Upload failed',
    }
  }
}
