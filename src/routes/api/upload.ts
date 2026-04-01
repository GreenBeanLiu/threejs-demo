import { createAPIFileRoute } from '@tanstack/react-start/api'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { auth } from '../../lib/auth'
import { getDb } from '../../lib/db'

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

      // Insert into LibSQL models table
      const db = getDb()
      await db.execute({
        sql: `
          INSERT INTO models (id, user_id, name, size, r2_key, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [id, userId, file.name, file.size, key, new Date().toISOString()]
      })

      const record = {
        id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: `/api/model/${id}${ext}`,
      }

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
