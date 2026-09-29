#!/usr/bin/env node
import { initStorage } from '../core/storage.mjs'
import { MeshDrive } from '../core/drive.mjs'
import { MeshSwarm } from '../core/swarm.mjs'
import path from 'path'
import fs from 'fs'

const args = process.argv.slice(2)
const command = args[0]

function printHelp() {
  console.log(`
💎 HyperDrive Mesh CLI (P2P Dezentral)
Usage:
  node src/cli/index.mjs create [name]             - Erstellt ein neues P2P-Drive & gibt den Key aus
  node src/cli/index.mjs share <ordner>            - Teilt einen lokalen Ordner im weltweiten P2P-DHT
  node src/cli/index.mjs pull <key> <zielordner>   - Synchronisiert ein P2P-Drive in einen lokalen Ordner
  node src/cli/index.mjs mcp                       - Startet den MCP-Server via Stdio für KI-Agenten
`)
}

async function main() {
  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  switch (command) {
    case 'create': {
      const name = args[1] || 'vault'
      const store = initStorage(path.join('./.storage', name))
      const drive = new MeshDrive(store)
      await drive.init()

      const swarm = new MeshSwarm(store)
      await swarm.join(drive.drive.discoveryKey, { server: true, client: true })

      console.log(`\n🎉 Drive "${name}" erfolgreich initialisiert!`)
      console.log(`🔑 Public Key (zum Teilen): ${drive.keyHex}`)
      console.log(`📡 Verbunden mit Hyperswarm DHT. Halte diesen Prozess aktiv, um zu seeden...\n`)
      
      // Prozess offenhalten
      process.on('SIGINT', async () => {
        console.log('\nBeende Seeder...')
        await swarm.destroy()
        await drive.close()
        process.exit(0)
      })
      break
    }

    case 'share': {
      const localFolder = args[1]
      if (!localFolder || !fs.existsSync(localFolder)) {
        console.error('❌ Fehler: Bitte einen gültigen lokalen Ordner angeben!')
        process.exit(1)
      }

      console.log(`📦 Lese Ordner ein: ${localFolder}...`)
      const store = initStorage('./.storage_seed')
      const drive = new MeshDrive(store)
      await drive.init()

      // Rekursiv Dateien einlesen
      async function addFiles(dir, baseDir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          const relPath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/')
          if (entry.isDirectory()) {
            await addFiles(fullPath, baseDir)
          } else {
            const data = fs.readFileSync(fullPath)
            await drive.writeFile(relPath, data)
            console.log(`  ➕ Gequeued: ${relPath} (${data.length} Bytes)`)
          }
        }
      }

      await addFiles(localFolder, localFolder)

      const swarm = new MeshSwarm(store)
      await swarm.join(drive.drive.discoveryKey, { server: true, client: false })

      console.log(`\n🚀 Ordner erfolgreich in P2P-Hyperdrive geladen!`)
      console.log(`🔑 Public Key: ${drive.keyHex}`)
      console.log(`🌐 Im DHT veröffentlicht. Drücke Strg+C zum Beenden.\n`)

      process.on('SIGINT', async () => {
        await swarm.destroy()
        await drive.close()
        process.exit(0)
      })
      break
    }

    case 'pull': {
      const key = args[1]
      const targetFolder = args[2]

      if (!key || !targetFolder) {
        console.error('❌ Fehler: Syntax: node src/cli/index.mjs pull <key> <zielordner>')
        process.exit(1)
      }

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true })
      }

      console.log(`🔍 Suche P2P-Drive [${key.slice(0, 8)}...] im DHT...`)
      const store = initStorage('./.storage_pull')
      const drive = new MeshDrive(store, key)
      await drive.init()

      const swarm = new MeshSwarm(store)
      await swarm.join(drive.drive.discoveryKey, { server: false, client: true })

      console.log('📡 Verbunden mit Schwarm. Warte auf Datei-Stream...')
      
      // Polling & Download
      const downloaded = new Set()
      const interval = setInterval(async () => {
        try {
          const files = await drive.listFiles('/')
          for (const f of files) {
            if (!downloaded.has(f.key)) {
              const content = await drive.drive.get(f.key)
              if (content) {
                const outPath = path.join(targetFolder, f.key)
                fs.mkdirSync(path.dirname(outPath), { recursive: true })
                fs.writeFileSync(outPath, content)
                console.log(`  ⬇️ Empfangen: ${f.key} (${content.length} Bytes)`)
                downloaded.add(f.key)
              }
            }
          }

          if (files.length > 0 && downloaded.size === files.length) {
            console.log(`\n🎉 Alle ${downloaded.size} Dateien erfolgreich dezentral synchronisiert!`)
            clearInterval(interval)
            await swarm.destroy()
            await drive.close()
            process.exit(0)
          }
        } catch (e) {
          // Sync läuft im Hintergrund
        }
      }, 500)

      break
    }

    case 'mcp': {
      const { MeshMCPServer } = await import('../mcp/server.mjs')
      const mcp = new MeshMCPServer()
      await mcp.start()
      console.error('[HYPERDRIVE-MESH] MCP Server läuft auf Stdio.')
      break
    }

    default:
      console.error(`Unbekannter Befehl: ${command}`)
      printHelp()
  }
}

main().catch(err => {
  console.error('❌ CLI-Fehler:', err)
  process.exit(1)
})
