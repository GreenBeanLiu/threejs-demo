import { createAPIFileRoute } from '@tanstack/react-start/api'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import type { UploadRecord } from './history'
import { auth } from '../../lib/auth'

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

const BUCKET = () => process.env.R2_BUCKET!

async function readMetadata(s3: S3Client, userId: string): Promise<UploadRecord[]> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET(), Key: `users/${userId}/metadata.json` }))
    const body = await res.Body?.transformToString()
    return body ? JSON.parse(body) as UploadRecord[] : []
  } catch {
    return []
  }
}

export const APIRoute = createAPIFileRoute('/api/upload')({
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const userId = session.user.id
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const ext = file.name.toLowerCase().endsWith('.gltf') ? '.gltf' : '.glb'
      const id = randomUUID()
      const key = `models/${id}${ext}`

      const buffer = Buffer.from(await file.arrayBuffer())
      const s3 = getS3()

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        Body: buffer,
        ContentType: ext === '.gltf' ? 'model/gltf+json' : 'model/gltf-binary',
      }))

      const record: UploadRecord = {
        id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: `/api/model/${id}${ext}`,
      }

      const records = await readMetadata(s3, userId)
      const updated = [record, ...records].slice(0, 20)

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET(),
        Key: `users/${userId}/metadata.json`,
        Body: JSON.stringify(updated, null, 2),
        ContentType: 'application/json',
      }))

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
