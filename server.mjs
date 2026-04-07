import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import app from './dist/server/server.js'

const port = Number(process.env.PORT || 3000)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, 'dist', 'client')
const uploadDir = process.env.NODE_ENV === 'production' ? '/uploads/models' : './models'

await mkdir(uploadDir, { recursive: true }).catch((error) => {
  console.error('Failed to ensure upload directory exists:', error)
})

const MIME = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
}

function resolveStaticPath(urlPath) {
  const safePath = normalize(urlPath).replace(/^([.][.][/\\])+/, '')
  return join(clientDir, safePath)
}

async function serveStatic(req, res) {
  try {
    const urlPath = new URL(req.url, 'http://localhost').pathname
    const filePath = resolveStaticPath(urlPath)

    if (!filePath.startsWith(clientDir)) {
      return false
    }

    const fileStat = await stat(filePath)

    if (!fileStat.isFile()) {
      return false
    }

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
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
    return
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    const served = await serveStatic(req, res)

    if (served) {
      return
    }
  }

  const protocol = req.socket.encrypted ? 'https' : 'http'
  const host = req.headers.host || `localhost:${port}`
  const url = new URL(req.url, `${protocol}://${host}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }
  }

  const maxBodyBytes = 100 * 1024 * 1024
  const body = ['GET', 'HEAD'].includes(req.method)
    ? undefined
    : await new Promise((resolve, reject) => {
        const chunks = []
        let size = 0

        req.on('data', (chunk) => {
          size += chunk.length
          if (size > maxBodyBytes) {
            req.destroy()
            reject(new Error('Payload too large'))
            return
          }

          chunks.push(chunk)
        })
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
      }).catch((error) => {
        const status = error instanceof Error && error.message === 'Payload too large' ? 413 : 400
        res.writeHead(status, { 'Content-Type': 'text/plain' })
        res.end(status === 413 ? 'Payload too large' : 'Failed to read request body')
        return null
      })

  if (body === null) {
    return
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
    duplex: body === undefined ? undefined : 'half',
  })

  let response
  try {
    response = await app.fetch(request)
  } catch (error) {
    console.error('SSR fetch error:', error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return
  }

  res.statusCode = response.status
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value)
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
