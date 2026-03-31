import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '../../lib/auth'
import { getDb, type ModelRecord } from '../../lib/db'

export interface UploadRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  path: string
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
    const db = getDb()
    const rows = db.prepare(`
      SELECT id, name, size, r2_key, uploaded_at
      FROM models
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
      LIMIT 50
    `).all(session.user.id) as ModelRecord[]

    const records: UploadRecord[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      size: r.size,
      uploadedAt: r.uploaded_at,
      path: `/api/model/${r.r2_key.replace('models/', '')}`,
    }))

    return new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
})
