import assert from 'assert'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { MeshMCPServer } from '../src/mcp/server.mjs'

async function testMCPInterface() {
  console.log('🧪 [TEST 3] Starte Test für MCP Server & Tool Calling...')

  // 1. In-Memory Transport für MCP initialisieren
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const mcpService = new MeshMCPServer('./.storage_test_mcp')

  await mcpService.server.connect(serverTransport)

  const client = new Client({ name: 'test-agent', version: '1.0.0' }, { capabilities: {} })
  await client.connect(clientTransport)
  console.log('  ✔️ MCP Client erfolgreich mit Server verbunden.')

  // 2. Tools auflisten
  const toolsRes = await client.listTools()
  console.log(`  ✔️ MCP Tools registriert: ${toolsRes.tools.length} Tools verfügbar.`)
  const toolNames = toolsRes.tools.map(t => t.name)
  assert.ok(toolNames.includes('p2p_drive_create'))
  assert.ok(toolNames.includes('p2p_file_write'))
  assert.ok(toolNames.includes('p2p_file_read'))
  assert.ok(toolNames.includes('p2p_swarm_status'))

  // 3. Drive über MCP erstellen
  console.log('  ✔️ Rufe Tool "p2p_drive_create" auf...')
  const createRes = await client.callTool({
    name: 'p2p_drive_create',
    arguments: { name: 'agent_shared_vault' }
  })
  const createData = JSON.parse(createRes.content[0].text)
  console.log('     Drive erstellt! Public Key:', createData.publicKey)
  assert.strictEqual(createData.status, 'success')
  assert.strictEqual(createData.publicKey.length, 64)

  // 4. Datei über MCP schreiben
  console.log('  ✔️ Rufe Tool "p2p_file_write" auf...')
  const writeRes = await client.callTool({
    name: 'p2p_file_write',
    arguments: {
      key: createData.publicKey,
      filePath: '/notes/mission.md',
      content: '# Geheime Mission\nHyperdrive Mesh via MCP ist scharfgeschaltet!'
    }
  })
  const writeData = JSON.parse(writeRes.content[0].text)
  assert.strictEqual(writeData.status, 'success')
  assert.strictEqual(writeData.path, '/notes/mission.md')

  // 5. Datei über MCP lesen
  console.log('  ✔️ Rufe Tool "p2p_file_read" auf...')
  const readRes = await client.callTool({
    name: 'p2p_file_read',
    arguments: {
      key: createData.publicKey,
      filePath: '/notes/mission.md'
    }
  })
  assert.ok(readRes.content[0].text.includes('Hyperdrive Mesh via MCP ist scharfgeschaltet!'))
  console.log('     Gelesener Inhalt via MCP verifiziert.')

  // 6. Aufräumen
  await client.close()
  await mcpService.close()
  console.log('🎉 [TEST 3 ERFOLGREICH] MCP Server & Tool-Execution vollständig grün!\n')
}

testMCPInterface().catch(err => {
  console.error('❌ [TEST 3 FEHLER]:', err)
  process.exit(1)
})
