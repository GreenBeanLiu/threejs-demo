import { createAPIFileRoute } from '@tanstack/react-start/api'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '../../lib/auth'

export interface UploadRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  path: string
}

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

export async function readMetadata(userId: string): Promise<UploadRecord[]> {
  try {
    const s3 = getS3()
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: `users/${userId}/metadata.json`,
    }))
    const body = await res.Body?.transformToString()
    return body ? JSON.parse(body) as UploadRecord[] : []
  } catch {
    return []
  }
}

export const APIRoute = createAPIFileRoute('/api/history')({
  GET: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const records = await readMetadata(session.user.id)
    return new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
})
