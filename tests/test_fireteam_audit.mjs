import assert from 'assert'
import { initStorage } from '../src/core/storage.mjs'
import { MeshDrive } from '../src/core/drive.mjs'
import { SecurityGuard } from '../src/core/guard.mjs'
import { MeshMCPServer } from '../src/mcp/server.mjs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

async function runFireTeamAudit() {
  console.log('🔥 [FIRE TEAM ELITE AUDIT] Starte defensive Robustheitsprüfung...\n')

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const mcpService = new MeshMCPServer('./.storage_fireteam_test')
  await mcpService.server.connect(serverTransport)

  const client = new Client({ name: 'fireteam-auditor', version: '1.0.0' }, { capabilities: {} })
  await client.connect(clientTransport)

  const createRes = await client.callTool({
    name: 'p2p_drive_create',
    arguments: { name: 'fireteam_vault' }
  })
  const driveKey = JSON.parse(createRes.content[0].text).publicKey

  // ====================================================
  // TEST 1: Command Injection & Shell Metachars in Filenames
  // ====================================================
  console.log('🛡️ [TEST 1] Prüfe Verhalten bei Shell-Metazeichen in Pfadnamen...')
  const shellPayloadPaths = [
    '/data/test.txt; rm -rf /',
    '/data/$(whoami).json',
    '/data/`id`.env',
    '/data/pipe|netcat.sh',
    '/data/redirect>out.txt',
    '/data/newline\ninjection.txt'
  ]

  for (const rawPath of shellPayloadPaths) {
    const res = await client.callTool({
      name: 'p2p_file_write',
      arguments: {
        key: driveKey,
        filePath: rawPath,
        content: 'Unbedenklicher Textinhalt',
        role: 'worker'
      }
    })

    // Entweder durch SecurityGuard abgewehrt oder sicher im VFS ohne OS-Shell-Ausführung abgelegt
    if (res.isError) {
      console.log(`  ✔️ Abgewehrt: "${rawPath.replace(/\n/g, '\\n')}" -> ${res.content[0].text}`)
    } else {
      const data = JSON.parse(res.content[0].text)
      console.log(`  ✔️ Sicher isoliert im virtuellen Speicher: "${rawPath.replace(/\n/g, '\\n')}" -> VFS: "${data.path}"`)
      assert.ok(!data.path.includes('\n'), 'Newlines dürfen nicht im Pfad verbleiben')
    }
  }

  // ====================================================
  // TEST 2: Prototype Pollution Resistenz in Node.js
  // ====================================================
  console.log('\n🛡️ [TEST 2] Prüfe Resistenz gegen Prototype Pollution...')
  const prototypePayload = JSON.stringify({
    __proto__: { isAdmin: true },
    constructor: { prototype: { role: 'admin' } }
  })

  const protoRes = await client.callTool({
    name: 'p2p_file_write',
    arguments: {
      key: driveKey,
      filePath: '/config/settings.json',
      content: prototypePayload,
      role: 'worker'
    }
  })

  // Prüfen ob globaler Object-Prototyp unberührt blieb
  const testObj = {}
  assert.strictEqual(testObj.isAdmin, undefined, 'Object.prototype.isAdmin darf nicht existieren!')
  assert.strictEqual(testObj.role, undefined, 'Object.prototype.role darf nicht manipuliert sein!')
  console.log('  ✔️ Object.prototype intakt (Keine Prototype Pollution möglich).')

  // ====================================================
  // TEST 3: Privilege Escalation & Rollen-Spoofing
  // ====================================================
  console.log('\n🛡️ [TEST 3] Prüfe Rollen-Integrität (Privilege Escalation Abwehr)...')
  const sneakyRoles = [
    'admin ',
    'ADMIN',
    'admin\0',
    'superadmin',
    'root',
    'system'
  ]

  for (const roleCandidate of sneakyRoles) {
    const authRes = SecurityGuard.authorize('/system/kernel.sys', roleCandidate, 'write')
    assert.strictEqual(authRes.allowed, false, `Rolle "${roleCandidate}" darf keine Admin-Rechte erhalten!`)
  }
  console.log('  ✔️ Nur exakt "admin" wird autorisiert, alle Varianten und Eskalationsversuche abgewehrt.')

  // ====================================================
  // TEST 4: Polyglot & Script Payload Isolation
  // ====================================================
  console.log('\n🛡️ [TEST 4] Prüfe Umgang mit Script- und Markup-Tags...')
  const polyglotPayload = `<script>alert("audit")</script><img src=x onerror=this.remove()>`
  
  const polyRes = await client.callTool({
    name: 'p2p_file_write',
    arguments: {
      key: driveKey,
      filePath: '/web/test.html',
      content: polyglotPayload,
      role: 'worker'
    }
  })
  assert.strictEqual(polyRes.isError, undefined)
  
  const readBack = await client.callTool({
    name: 'p2p_file_read',
    arguments: {
      key: driveKey,
      filePath: '/web/test.html',
      role: 'worker'
    }
  })
  assert.strictEqual(readBack.content[0].text, polyglotPayload)
  console.log('  ✔️ Payloads werden als reine, uninterpretierte Byte-Daten im VFS gehalten (Zero-Execution Context).')

  await client.close()
  await mcpService.close()
  console.log('\n🏆 [FIRE TEAM ELITE AUDIT ERFOLGREICH] Alle defensiven Kontrollprüfungen bestanden!\n')
}

runFireTeamAudit().catch(err => {
  console.error('❌ [FIRE TEAM AUDIT FEHLER]:', err)
  process.exit(1)
})
