import { createAPIFileRoute } from '@tanstack/react-start/api'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const UPLOAD_DIR = '/uploads/models'

export const APIRoute = createAPIFileRoute('/api/model/$id')({
  GET: async ({ params }) => {
    const id = params.id as string
    // id includes extension e.g. "uuid.glb"
    const filePath = join(UPLOAD_DIR, id)
    // Prevent path traversal
    if (!filePath.startsWith(UPLOAD_DIR) || id.includes('..')) {
      return new Response('Forbidden', { status: 403 })
    }
    if (!existsSync(filePath)) {
      return new Response('Not found', { status: 404 })
    }
    const data = await readFile(filePath)
    const isGltf = id.endsWith('.gltf')
    return new Response(data, {
      headers: {
        'Content-Type': isGltf ? 'model/gltf+json' : 'model/gltf-binary',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  },
})
