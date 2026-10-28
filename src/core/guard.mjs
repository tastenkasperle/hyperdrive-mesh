/**
 * SecurityGuard v2.0 (OWASP Agentic Security Standard 2026)
 * Schützt HyperDrive Mesh gegen Indirect Injections, Obfuscated Payloads,
 * Exfiltrationsversuche, Bidi-Spoofing und unautorisierte Pfade.
 */

import path from 'path'

// Erweiterte Injection-Muster nach OWASP GenAI 2026
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /system\s*prompt\s*override/i,
  /you\s+are\s+now\s+in\s+([a-z0-9_-]+)?mode/i,
  /new\s+role\s*:\s*you\s+must/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[SYSTEM_PROMPT\]/i,
  /\[OVERRIDE\]/i,
  /DAN\s+Mode/i,
  /act\s+as\s+(an?\s+)?unrestricted/i,
  /developer\s*mode\s*enabled/i
]

// Markdown Image / Exfiltration URL Patterns (z. B. ![leak](https://attacker.com/leak?data=))
const EXFILTRATION_PATTERNS = [
  /!\[.*?\]\((https?:\/\/[^\s)]+)\)/i,
  /<img\s+[^>]*src=["'](https?:\/\/[^"']+)["']/i
]

// Sensible Credentials / Secrets
const SENSITIVE_PATH_PATTERNS = [
  /(\.env|credentials|secret|masterpw|id_rsa|id_ed25519|id_ecdsa|\.pem|\.key)/i,
  /(token|apikey|password|passwd|shadow|auth\.json)/i
]

export class SecurityGuard {
  /**
   * Prüft und bereinigt Textinhalte nach OWASP GenAI 2026 Standards
   * @param {string} content 
   * @returns {{ safe: boolean, threats: string[], sanitized: string }}
   */
  static inspectPayload(content) {
    if (typeof content !== 'string') {
      return { safe: true, threats: [], sanitized: content }
    }

    const threats = []

    // 1. Unicode-Normalisierung (NFKC) gegen Homoglyphen & Bidi-Overrides (U+202E etc.)
    let normalized = content.normalize('NFKC')
    const bidiRegex = /[\u202A-\u202E\u2066-\u2069]/g
    if (bidiRegex.test(normalized)) {
      threats.push('Unicode BiDi Override detected (Visual spoofing attack)')
      normalized = normalized.replace(bidiRegex, '')
    }

    // 2. Unsichtbare Zero-Width Zeichen entfernen
    const zeroWidthRegex = /[\u200B-\u200D\uFEFF]/g
    if (zeroWidthRegex.test(normalized)) {
      threats.push('Zero-Width Unicode Characters (Obfuscation detected)')
      normalized = normalized.replace(zeroWidthRegex, '')
    }

    // 3. Rekursive Base64-Inspektion (Erkennt versteckte Jailbreaks in Base64-Strings)
    const base64Matches = normalized.match(/[A-Za-z0-9+/]{20,}={0,2}/g) || []
    for (const b64 of base64Matches) {
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8')
        // Prüfen ob decodierter Text ein lesbarer Angriffs-Prompt ist
        for (const pattern of INJECTION_PATTERNS) {
          if (pattern.test(decoded)) {
            threats.push(`Obfuscated Base64 Injection detected: "${decoded.slice(0, 40)}..."`)
          }
        }
      } catch (e) {
        // Kein gültiger UTF-8 String, ignorieren
      }
    }

    // 4. Direkte Prompt Injection Muster
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(normalized)) {
        threats.push(`Prompt Injection Pattern matched: ${pattern.toString()}`)
      }
    }

    // 5. Data Exfiltration / Tracking-Pixel Check
    for (const exfil of EXFILTRATION_PATTERNS) {
      if (exfil.test(normalized)) {
        threats.push(`Potential Data-Exfiltration Vector detected (Outbound Image/Link Ping)`)
      }
    }

    return {
      safe: threats.length === 0,
      threats,
      sanitized: normalized
    }
  }

  /**
   * Normalisiert virtuelle Pfade exakt synchron zu MeshDrive.sanitizePath,
   * damit Traversal-Bypässe ("system/cfg", "/a/../system/cfg") vor der Autorisierung abgefangen werden.
   * @param {string} p
   * @returns {string}
   */
  static normalizeVirtualPath(p) {
    if (!p || typeof p !== 'string') return '/'
    let clean = p.replace(/[\0\r\n\t]/g, '').trim().replace(/\\/g, '/')
    clean = clean.replace(/^[a-zA-Z]:/, '')
    clean = path.posix.normalize('/' + clean)
    const segments = clean.split('/').filter(s => {
      const trimmed = s.trim()
      return trimmed.length > 0 && !/^\.+$/.test(trimmed)
    })
    return '/' + segments.join('/')
  }

  /**
   * Prüft Pfad-Berechtigungen (Capability-Based Access Control)
   * @param {string} filePath 
   * @param {string} agentRole ('admin' | 'worker' | 'guest')
   * @param {'read' | 'write'} action 
   */
  static authorize(filePath, agentRole = 'worker', action = 'write') {
    const cleanPath = SecurityGuard.normalizeVirtualPath(filePath)

    // Nur exakt 'admin' besitzt Root-Rechte
    const isAdmin = agentRole === 'admin'

    // Gäste dürfen niemals schreiben
    if (agentRole === 'guest' && action === 'write') {
      return { allowed: false, reason: 'Guest agents are read-only.' }
    }

    // System-Pfade sind strikt Admin-Only (geprüft auf kanonischem Pfad!)
    if ((cleanPath === '/system' || cleanPath.startsWith('/system/')) && !isAdmin && action === 'write') {
      return { allowed: false, reason: 'System paths are write-protected (Admin only).' }
    }

    // Credential- & Secret-Dateien sind für Nicht-Admins komplett gesperrt
    for (const pattern of SENSITIVE_PATH_PATTERNS) {
      if ((pattern.test(filePath) || pattern.test(cleanPath)) && !isAdmin) {
        return { 
          allowed: false, 
          reason: `Access to sensitive path "${cleanPath}" blocked for role "${agentRole}".` 
        }
      }
    }

    return { allowed: true }
  }
}
