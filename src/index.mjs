import { MeshMCPServer } from './mcp/server.mjs'

async function main() {
  const server = new MeshMCPServer()
  await server.start()
  console.error('[HYPERDRIVE-MESH] MCP-Server via Stdio gestartet.')
}

main().catch(err => {
  console.error('[HYPERDRIVE-MESH FEHLER]:', err)
  process.exit(1)
})
