import assert from 'assert'
import { initStorage } from '../src/core/storage.mjs'
import { MeshDrive } from '../src/core/drive.mjs'

async function testCoreDrive() {
  console.log('🧪 [TEST 1] Starte Test für MeshDrive Core...')

  // 1. In-Memory Store erzeugen
  const store = initStorage(null)
  const drive = new MeshDrive(store)
  await drive.init()

  console.log('  ✔️ Drive erfolgreich initialisiert.')
  console.log('  🔑 Public Key:', drive.keyHex)
  assert.strictEqual(typeof drive.keyHex, 'string')
  assert.strictEqual(drive.keyHex.length, 64)

  // 2. Datei schreiben
  const testData = 'Diamantenschmiede: P2P-Speicher läuft einwandfrei.'
  const writeRes = await drive.writeFile('/status.txt', testData)
  console.log(`  ✔️ Datei geschrieben: ${writeRes.path} (${writeRes.bytes} Bytes, Version ${writeRes.version})`)
  assert.strictEqual(writeRes.bytes, Buffer.byteLength(testData))

  // 3. Datei lesen
  const readData = await drive.readFile('/status.txt')
  console.log('  ✔️ Datei gelesen:', readData)
  assert.strictEqual(readData, testData)

  // 4. Verzeichnis auflisten
  const list = await drive.listFiles('/')
  console.log(`  ✔️ Verzeichnisinhalt geprüft: ${list.length} Datei(en) gefunden.`)
  assert.strictEqual(list.length, 1)
  assert.strictEqual(list[0].key, '/status.txt')

  // 5. Schließen
  await drive.close()
  console.log('🎉 [TEST 1 ERFOLGREICH] Alle Core-Drive Assertions bestanden!\n')
}

testCoreDrive().catch(err => {
  console.error('❌ [TEST 1 FEHLER]:', err)
  process.exit(1)
})
