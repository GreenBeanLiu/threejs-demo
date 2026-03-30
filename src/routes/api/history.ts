import { createAPIFileRoute } from '@tanstack/react-start/api'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const METADATA_PATH = '/uploads/metadata.json'

export interface UploadRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  path: string
}

export async function readMetadata(): Promise<UploadRecord[]> {
  if (!existsSync(METADATA_PATH)) return []
  try {
    const raw = await readFile(METADATA_PATH, 'utf-8')
    return JSON.parse(raw) as UploadRecord[]
  } catch {
    return []
  }
}

export const APIRoute = createAPIFileRoute('/api/history')({
  GET: async () => {
    const records = await readMetadata()
    return new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
})
