import { createServer } from 'node:http'
import app from './dist/server/server.js'

const port = process.env.PORT || 3000

createServer(async (req, res) => {
  const protocol = req.socket.encrypted ? 'https' : 'http'
  const host = req.headers.host || `localhost:${port}`
  const url = new URL(req.url, `${protocol}://${host}`)

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
  }

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((resolve) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
    duplex: 'half',
  })

  const response = await app.fetch(request)

  res.statusCode = response.status
  for (const [key, val] of response.headers.entries()) {
    res.setHeader(key, val)
  }

  if (response.body) {
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
  }
  res.end()
}).listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
