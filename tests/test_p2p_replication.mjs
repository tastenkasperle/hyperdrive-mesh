import assert from 'assert'
import { initStorage } from '../src/core/storage.mjs'
import { MeshDrive } from '../src/core/drive.mjs'
import { MeshSwarm } from '../src/core/swarm.mjs'

async function testP2PReplication() {
  console.log('🧪 [TEST 2] Starte P2P-Replikationstest zwischen 2 Peers...')

  // 1. Peer A (Writer / Seeder)
  console.log('  1️⃣ Initialisiere Peer A (Seeder)...')
  const storeA = initStorage(null)
  const driveA = new MeshDrive(storeA)
  await driveA.init()
  const swarmA = new MeshSwarm(storeA)

  const secretMessage = 'P2P-Sync funktioniert ohne Server!'
  await driveA.writeFile('/agent_memory.txt', secretMessage)
  console.log('     Datei auf Peer A geschrieben. Key:', driveA.keyHex)

  // Peer A tritt dem DHT-Schwarm bei
  await swarmA.join(driveA.drive.discoveryKey, { server: true, client: false })
  console.log('     Peer A announced im Hyperswarm DHT.')

  // 2. Peer B (Reader / Leecher)
  console.log('  2️⃣ Initialisiere Peer B (Leecher mit Key von Peer A)...')
  const storeB = initStorage(null)
  const driveB = new MeshDrive(storeB, driveA.keyHex)
  await driveB.init()
  const swarmB = new MeshSwarm(storeB)

  // Peer B sucht Peer A im Schwarm
  await swarmB.join(driveB.drive.discoveryKey, { server: false, client: true })
  console.log('     Peer B sucht Peer A im DHT...')

  // 3. Warten auf Replikation & Datei auslesen
  console.log('  3️⃣ Warte auf P2P-Verbindung und lese Datei...')
  const readPromise = new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout beim P2P-Sync nach 15s')), 15000)
    
    // Polling des Inhalts
    while (true) {
      try {
        const content = await driveB.readFile('/agent_memory.txt')
        if (content) {
          clearTimeout(timeout)
          return resolve(content)
        }
      } catch (e) {
        // Ignorieren während Sync
      }
      await new Promise(r => setTimeout(r, 200))
    }
  })

  const receivedData = await readPromise
  console.log('  ✔️ Erfolgreich empfangen auf Peer B:', receivedData)
  assert.strictEqual(receivedData, secretMessage)

  // 4. Aufräumen
  await swarmA.destroy()
  await swarmB.destroy()
  await driveA.close()
  await driveB.close()

  console.log('🎉 [TEST 2 ERFOLGREICH] 100% serverlose P2P-Replikation über DHT verifiziert!\n')
}

testP2PReplication().catch(err => {
  console.error('❌ [TEST 2 FEHLER]:', err)
  process.exit(1)
})
