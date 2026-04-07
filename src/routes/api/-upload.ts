import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '../../lib/auth'
import { getDb } from '../../lib/db'

const ALLOWED_EXTENSIONS = ['.glb', '.gltf'] as const
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const JSON_HEADERS = { 'Content-Type': 'application/json' }

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  })
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value
}

function getS3() {
  const accountId = getRequiredEnv('R2_ACCOUNT_ID')
  const accessKeyId = getRequiredEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = getRequiredEnv('R2_SECRET_ACCESS_KEY')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function getBucket() {
  return getRequiredEnv('R2_BUCKET')
}

function getFileExtension(fileName: string) {
  const normalizedName = fileName.toLowerCase()

  return ALLOWED_EXTENSIONS.find((extension) => normalizedName.endsWith(extension)) ?? null
}

function validateFile(file: File | null) {
  if (!file) {
    return { ok: false as const, status: 400, error: 'No file provided' }
  }

  if (!file.name.trim()) {
    return { ok: false as const, status: 400, error: 'Uploaded file must have a name' }
  }

  const ext = getFileExtension(file.name)

  if (!ext) {
    return {
      ok: false as const,
      status: 400,
      error: 'Only .glb and .gltf files are supported',
    }
  }

  if (file.size <= 0) {
    return { ok: false as const, status: 400, error: 'Uploaded file is empty' }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false as const,
      status: 413,
      error: `File is too large. Max size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`,
    }
  }

  return { ok: true as const, ext }
}

export const APIRoute = createAPIFileRoute('/api/upload')({
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const userId = session.user.id

    try {
      const formData = await request.formData()
      const fileValue = formData.get('file')
      const file = fileValue instanceof File ? fileValue : null
      const validation = validateFile(file)

      if (!validation.ok) {
        return jsonResponse({ error: validation.error }, validation.status)
      }

      const id = randomUUID()
      const key = `models/${id}${validation.ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const s3 = getS3()

      await s3.send(
        new PutObjectCommand({
          Bucket: getBucket(),
          Key: key,
          Body: buffer,
          ContentType:
            validation.ext === '.gltf' ? 'model/gltf+json' : 'model/gltf-binary',
        }),
      )

      const uploadedAt = new Date().toISOString()
      const db = getDb()
      await db.execute({
        sql: `
          INSERT INTO models (id, user_id, name, size, r2_key, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [id, userId, file.name, file.size, key, uploadedAt],
      })

      return jsonResponse({
        id,
        name: file.name,
        size: file.size,
        uploadedAt,
        path: `/api/model/${id}${validation.ext}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      const status = /is not configured$/i.test(message) ? 500 : 500

      return jsonResponse(
        {
          error:
            status === 500 && /is not configured$/i.test(message)
              ? `Upload service misconfigured: ${message}`
              : message,
        },
        status,
      )
    }
  },
})
