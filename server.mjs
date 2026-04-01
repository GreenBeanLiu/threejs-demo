console.log('>>> Server starting...')
import { createServer } from 'node:http'
import { readFile, stat, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

console.log('>>> Importing app bundle...')
import app from './dist/server/server.js'
console.log('>>> App bundle imported successfully')

const port = process.env.PORT || 3000
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, 'dist', 'client')

// Health check and simple response test
const IS_HEALTHY = true

// Ensure upload directories exist
if (process.env.NODE_ENV === 'production') {
  await mkdir('/uploads/models', { recursive: true }).catch(() => {})
} else {
  await mkdir('./models', { recursive: true }).catch(() => {})
}

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
  // Quick health check
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
    return
  }

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

  const MAX_BODY = 100 * 1024 * 1024 // 100 MB
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', c => {
      size += c.length
      if (size > MAX_BODY) { req.destroy(); reject(new Error('Payload too large')); return }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  }).catch(() => {
    res.writeHead(413, { 'Content-Type': 'text/plain' })
    res.end('Payload too large')
    return null
  })
  if (body === null) return

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
    duplex: 'half',
  })

  let response
  try {
    response = await app.fetch(request)
  } catch (err) {
    console.error('SSR Fetch Error:', err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(`Internal Server Error: ${err.message}`)
    return
  }

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
