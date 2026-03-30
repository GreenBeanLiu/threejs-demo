import { createAPIFileRoute } from '@tanstack/react-start/api'
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { UploadRecord } from './history'

const UPLOAD_DIR = '/uploads/models'
const METADATA_PATH = '/uploads/metadata.json'

async function readMetadata(): Promise<UploadRecord[]> {
  if (!existsSync(METADATA_PATH)) return []
  try {
    const raw = await readFile(METADATA_PATH, 'utf-8')
    return JSON.parse(raw) as UploadRecord[]
  } catch {
    return []
  }
}

async function writeMetadata(records: UploadRecord[]) {
  await writeFile(METADATA_PATH, JSON.stringify(records, null, 2), 'utf-8')
}

export const APIRoute = createAPIFileRoute('/api/upload')({
  POST: async ({ request }) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const ext = file.name.endsWith('.gltf') ? '.gltf' : '.glb'
      const id = randomUUID()
      const filename = `${id}${ext}`

      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const filePath = join(UPLOAD_DIR, filename)
      await writeFile(filePath, buffer)

      const record: UploadRecord = {
        id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: `/api/model/${id}${ext}`,
      }

      const records = await readMetadata()
      // Keep max 20 most recent
      const updated = [record, ...records].slice(0, 20)
      await writeMetadata(updated)

      return new Response(JSON.stringify(record), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
})
