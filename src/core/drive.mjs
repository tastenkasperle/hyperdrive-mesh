import Hyperdrive from 'hyperdrive'
import b4a from 'b4a'
import path from 'path'

/**
 * Erstellt oder lädt ein Hyperdrive über einen Corestore
 */
export class MeshDrive {
  constructor(store, key = null) {
    this.store = store
    this.key = key ? (typeof key === 'string' ? b4a.from(key, 'hex') : key) : null
    this.drive = new Hyperdrive(this.store, this.key)
    this.ready = false
  }

  async init() {
    await this.drive.ready()
    this.key = this.drive.key
    this.ready = true
    return this
  }

  get keyHex() {
    return this.key ? b4a.toString(this.key, 'hex') : null
  }

  get version() {
    return this.drive.version
  }

  sanitizePath(p) {
    if (!p) return '/'
    // Null-Bytes, Steuerzeichen (\r, \n, \t) und Whitespace trimmen
    let clean = p.replace(/[\0\r\n\t]/g, '').trim().replace(/\\/g, '/')
    
    // Windows Laufwerksbuchstaben entfernen (z. B. C:)
    clean = clean.replace(/^[a-zA-Z]:/, '')
    
    // POSIX Normalisierung
    clean = path.posix.normalize('/' + clean)
    
    // Traversal-Schutz: Filtere alle Segmente, die nur Punkte enthalten (., .., ..., etc.)
    const segments = clean.split('/').filter(s => {
      const trimmed = s.trim()
      return trimmed.length > 0 && !/^\.+$/.test(trimmed)
    })
    return '/' + segments.join('/')
  }

  async writeFile(filePath, content) {
    const cleanPath = this.sanitizePath(filePath)
    const buf = typeof content === 'string' ? b4a.from(content) : content
    await this.drive.put(cleanPath, buf)
    return { path: cleanPath, bytes: buf.length, version: this.drive.version }
  }

  async readFile(filePath) {
    const cleanPath = this.sanitizePath(filePath)
    const buf = await this.drive.get(cleanPath)
    if (!buf) return null
    return b4a.toString(buf)
  }

  async listFiles(prefix = '/') {
    const files = []
    for await (const entry of this.drive.list(prefix)) {
      files.push({
        key: entry.key,
        size: entry.value.blob ? entry.value.blob.byteLength : 0,
        seq: entry.seq
      })
    }
    return files
  }

  async close() {
    await this.drive.close()
    await this.store.close()
  }
}
