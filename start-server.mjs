import handler from './dist/server/server.js'
import { toNodeHandler } from 'srvx/node'
import http from 'node:http'

const port = Number(process.env.PORT || 3000)
const nodeHandler = toNodeHandler(handler.fetch)

const server = http.createServer((req, res) => {
  nodeHandler(req, res)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`PackView server listening on http://0.0.0.0:${port}`)
})
