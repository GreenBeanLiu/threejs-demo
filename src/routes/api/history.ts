import { createAPIFileRoute } from '@tanstack/react-start/api'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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

export async function readMetadata(): Promise<UploadRecord[]> {
  try {
    const s3 = getS3()
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: 'metadata.json',
    }))
    const body = await res.Body?.transformToString()
    return body ? JSON.parse(body) as UploadRecord[] : []
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
