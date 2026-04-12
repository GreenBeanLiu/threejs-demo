import handler from './dist/server/server.js'
import { toNodeHandler } from 'srvx/node'
import http from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'

const port = Number(process.env.PORT || 3000)
const nodeHandler = toNodeHandler(handler.fetch)
const clientRoot = path.resolve('dist/client')

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8',
}

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

async function serveStatic(req, res) {
  const url = new URL(req.url || '/', 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)

  if (pathname.includes('..')) {
    res.writeHead(400)
    res.end('Bad request')
    return true
  }

  const candidatePath = pathname === '/' ? null : path.join(clientRoot, pathname.replace(/^\//, ''))

  if (!candidatePath || !candidatePath.startsWith(clientRoot) || !existsSync(candidatePath)) {
    return false
  }

  const fileStat = await stat(candidatePath)
  if (!fileStat.isFile()) {
    return false
  }

  res.writeHead(200, {
    'Content-Type': getContentType(candidatePath),
    'Content-Length': String(fileStat.size),
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  })
  createReadStream(candidatePath).pipe(res)
  return true
}

const server = http.createServer(async (req, res) => {
  if (await serveStatic(req, res)) {
    return
  }

  nodeHandler(req, res)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`PackView server listening on http://0.0.0.0:${port}`)
})
