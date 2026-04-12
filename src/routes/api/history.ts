import { createFileRoute } from '@tanstack/react-router'
import { auth } from '../../lib/auth'
import { getDb, type ModelRecord } from '../../lib/db'

export interface UploadRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  path: string
}

export const Route = createFileRoute('/api/history')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const db = getDb()
        const result = await db.execute({
          sql: `
            SELECT id, user_id, name, size, r2_key, uploaded_at
            FROM models
            WHERE user_id = ?
            ORDER BY uploaded_at DESC
            LIMIT 50
          `,
          args: [session.user.id],
        })

        const rows = result.rows as unknown as ModelRecord[]

        const records: UploadRecord[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          size: r.size,
          uploadedAt: r.uploaded_at,
          path: `/api/model/${r.r2_key.replace('models/', '')}`,
        }))

        return Response.json(records)
      },
    },
  },
})
