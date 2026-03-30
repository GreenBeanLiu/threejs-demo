import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './dist/server/server.js'

const port = process.env.PORT || 3000
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, 'dist', 'client')

const MIME = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
}

async function serveStatic(req, res) {
  try {
    const urlPath = new URL(req.url, 'http://localhost').pathname
    const filePath = join(clientDir, urlPath)
    // Security: ensure path is within clientDir
    if (!filePath.startsWith(clientDir)) return false
    const s = await stat(filePath)
    if (!s.isFile()) return false
    const ext = extname(filePath)
    const mime = MIME[ext] || 'application/octet-stream'
    const data = await readFile(filePath)
    const isImmutable = urlPath.startsWith('/assets/')
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': data.length,
      'Cache-Control': isImmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    res.end(data)
    return true
  } catch {
    return false
  }
}

createServer(async (req, res) => {
  // Serve static files first
  if (req.method === 'GET' || req.method === 'HEAD') {
    const served = await serveStatic(req, res)
    if (served) return
  }

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
