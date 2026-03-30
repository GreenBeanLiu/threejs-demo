import { createAPIFileRoute } from '@tanstack/react-start/api'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

function getS3() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export const APIRoute = createAPIFileRoute('/api/model/$id')({
  GET: async ({ params }) => {
    const id = params.id as string
    // Prevent path traversal
    if (id.includes('..') || id.includes('/')) {
      return new Response('Forbidden', { status: 403 })
    }
    const isGltf = id.endsWith('.gltf')
    const key = `models/${id}`
    try {
      const s3 = getS3()
      const res = await s3.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
      }))
      const data = await res.Body?.transformToByteArray()
      if (!data) return new Response('Not found', { status: 404 })
      return new Response(data, {
        headers: {
          'Content-Type': isGltf ? 'model/gltf+json' : 'model/gltf-binary',
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': String(data.byteLength),
        },
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  },
})
