import Corestore from 'corestore'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * Initialisiert den persistenten oder ephemeren Corestore
 * @param {string|null} storageDir - Optionaler lokaler Speicherpfad. Falls null, ephemerer Temp-Ordner.
 * @returns {Corestore}
 */
export function initStorage(storageDir = null) {
  const targetDir = storageDir 
    ? path.resolve(storageDir) 
    : fs.mkdtempSync(path.join(os.tmpdir(), 'hyperdrive-mesh-'))

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  return new Corestore(targetDir)
}
