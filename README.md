# 💎 HyperDrive Mesh (P2P Agent-Mesh Storage)

[![Platform: Cross-Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-0078D6.svg)](https://nodejs.org)
[![Runtime: Node.js 20+](https://img.shields.io/badge/Node.js-20%2B%20%7C%2024%20(Standalone)-339933.svg?logo=node.js)](https://nodejs.org)
[![Protocol: Hypercore Protocol v10](https://img.shields.io/badge/Protocol-Hyperdrive%20%7C%20Hyperswarm-FF4081.svg)](https://hypercore-protocol.org/)
[![MCP: Native Ready](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6C5CE7.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Ein ultra-leichtes, **100 % dezentrales und serverloses P2P-Speichersystem mit nativem Model Context Protocol (MCP)** für autonome KI-Agenten, Entwickler-Teams und Multi-Maschinen-Setups.

Geborgen und veredelt aus dem historischen Open-Source-Ökosystem des **Beaker Browsers** – befreit von monolithischem Electron-Ballast und neu geschmiedet für die KI-Ära.

---

## ⚡ Highlights & Engineering-Features

* **🌐 100 % Serverlos & Dezentral:** Direkte Peer-to-Peer Verbindung über das weltweite **Hyperswarm DHT**. Automatisches NAT-Holepunching. Keine offenen Ports am Router, keine statischen IP-Adressen und **Null Cloud-Kosten**.
* **🔒 End-to-End Verschlüsselt:** Alle Datenübertragungen laufen kryptografisch abgesichert über das Noise-Protokoll mit Blake2b-Hashes und Ed25519-Schlüsselpaaren.
* **⚡ Sparse Content-Streaming (vs. Syncthing):** Daten müssen nicht komplett heruntergeladen werden. KI-Agenten und Edge-Nodes streamen gezielt genau die Bytes on-demand, die sie gerade lesen.
* **⏳ Time-Travel & Snapshot-Versionierung:** Integriertes kryptografisches Append-Only Log. Ermöglicht atomare Rollbacks und versionsgenaue Checkpoints für Multi-Agenten-Transaktionen.
* **🤖 Nativer MCP-Server:** Vollständige Stdio-Integration für **Antigravity, Claude Desktop, Cursor und CrewAI**. Agenten können dezentrale Speicher-Drives per Funktionsaufruf erstellen, teilen und synchronisieren.
* **🪶 Leichtgewichtig & Portabel:** Läuft auf Windows, Linux und macOS als reiner Standard-Nutzer ohne Admin-Rechte, ohne C++ Compiler-Hölle und mit minimalem RAM-Footprint (~35 MB).

---

## 📊 Architektur & Paketstruktur

Die Codebase folgt strikter **Separation of Concerns (SoC)**:

```text
diamantenschmiede/hyperdrive_mesh/
├── SPEC.md                    # Detaillierte Architektur-Spezifikation
├── README.md                  # Projekt-Dokumentation & Case Study
├── package.json               # Package Manifest & Skripte
├── src/
│   ├── index.mjs              # MCP Server Stdio Launcher
│   ├── core/
│   │   ├── storage.mjs        # Corestore-Initialisierung & ephemere Pfade
│   │   ├── drive.mjs          # Hyperdrive Virtual File System (VFS) & Snapshots
│   │   └── swarm.mjs          # Hyperswarm DHT Discovery & Replikations-Events
│   ├── cli/
│   │   └── index.mjs          # CLI Router (create, share, pull, mcp)
│   └── mcp/
│       └── server.mjs         # Offizielle Model Context Protocol Implementierung
└── tests/
    ├── test_core_drive.mjs    # Lokaler CRUD- & VFS-Test
    ├── test_p2p_replication.mjs # 2-Peers Live DHT Replikationstest
    └── test_mcp_interface.mjs # In-Memory MCP Client/Server Tool-Calling Test
```

---

## 🚀 Schnellstart

### 1. Installation
```bash
# Repository klonen & Abhängigkeiten installieren
cd diamantenschmiede/hyperdrive_mesh
npm install
```

### 2. Als CLI-Tool verwenden

#### A. Ordner im dezentralen P2P-Netzwerk teilen:
```bash
node src/cli/index.mjs share ./mein-projekt-ordner
```
*Gibt einen 64-stelligen Public Key aus (z. B. `0ba2132d70493d2c...`).*

#### B. Auf einem anderen Rechner (z. B. ThinkStation oder Tuf) synchronisieren:
```bash
node src/cli/index.mjs pull <PUBLIC_KEY> ./ziel-ordner
```
*Findet den Peer über den DHT und lädt die Daten vollautomatisch herunter.*

---

## 🤖 Einbindung als MCP-Server für KI-Agenten

Trage HyperDrive Mesh in deine `mcpSettings.json` (z. B. in Antigravity oder Claude Desktop) ein:

```json
{
  "mcpServers": {
    "hyperdrive_mesh": {
      "command": "node",
      "args": ["C:/Users/UserS2025/Desktop/Development/diamantenschmiede/hyperdrive_mesh/src/index.mjs"]
    }
  }
}
```

### Verfügbare MCP-Tools für Agenten:
1. `p2p_drive_create({ name })`: Erstellt ein neues P2P-Drive und seedet es im DHT.
2. `p2p_drive_connect({ key })`: Verbindet den Agenten mit einem Remote-Drive via Public Key.
3. `p2p_file_write({ key, filePath, content })`: Schreibt Daten ins dezentrale Dateisystem.
4. `p2p_file_read({ key, filePath })`: Liest dezentral gestreamte Daten aus.
5. `p2p_drive_list({ key, prefix })`: Inspiziert Verzeichnisstrukturen.
6. `p2p_swarm_status()`: Zeigt aktive Drives und verbundene P2P-Peers.

---

## 🧪 Automatisierte Test-Suite

Alle Module sind durch automatisierte Tests verifiziert:

```bash
# 1. Lokales File-System & VFS prüfen
npm test

# 2. Live P2P Replikation über weltweiten DHT testen
npm run test:p2p

# 3. MCP Tool-Calling Schnittstelle prüfen
node tests/test_mcp_interface.mjs
```

---

## 🐺 Case Study: Spec-Driven Multi-Agent Engineering

> *"Wie kann man brachliegende historische Durchbrüche aus dem Open-Source-Sumpf bergen und ohne Vibe-Coding-Schludrigkeit zu produktionsreifen Werkzeugen veredeln?"*

### 1. Das Identifizierte Problem
Auf Plattformen wie X/Twitter und in Entwicklerforen herrscht akute Ratlosigkeit bei der Frage:  
*„Wie synchronisieren autonome Agenten ihren Zustand und ihr Gedächtnis dezentral über mehrere Maschinen hinweg?“*  
Gängige Antworten scheitern an der Praxis:
* **Syncthing:** Ein reines Dateisynchronisations-Tool für Menschen. Wenn mehrere Agenten parallel schreiben, entstehen Dateikonflikte (`.sync-conflict`) und korrupte Datenbank-Locks. Zudem fehlt Sparse-Streaming.
* **Cloud-Monopole:** Das Hochladen sensibler Zwischenzustände in zentrale AWS-S3-Buckets oder Google Drive widerspricht dem Gedanken privater, lokaler KI-Infrastruktur.

### 2. Die historische Bergung (Operation Deep Mine)
Ein autonomes Multi-Agenten-Team (**Wolfsrudel**) durchsuchte nach First-Principles-Kriterien die Open-Source-Geschichte nach verlassenen 80%-Lösungen.  
Dabei stießen die Scouts auf den **Beaker Browser** (~6.7k Stars). Das Team um Paul Frazee hatte mit Hypercore/Hyperdrive ein Meisterwerk geschaffen, das Projekt jedoch in einem monolithischen Electron-Webbrowser vergraben. Nach dem Ende der Browser-Entwicklung verstaubte der Kern.

### 3. Der ingenieurmäßige Hebel
Statt das Rad neu zu erfinden, schnitt das Agenten-Team den Browser-Ballast vollständig ab:
1. **Core-Extraktion:** Portierung auf das moderne Hypercore v10 Ökosystem (`corestore`, `hyperswarm`, `hyperdrive`).
2. **Ephemeres Speicher-Management:** Saubere Trennung von persistenten und flüchtigen RAM-Puffern für Windows-Standardnutzer ohne Admin-Rechte.
3. **MCP-Standardisierung:** Kapselung der P2P-Primitive in ein standardisiertes Model Context Protocol Interface.

**Ergebnis:** Ein einsatzbereites, robustes Werkzeug, das der gesamten Open-Source-Community geschenkt werden kann – als Beweis für die Kraft zielgerichteter, disziplinierter Multi-Agenten-Orchestrierung.

---

## 📜 Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](./LICENSE) lizenziert.  
Basiert auf den genialen Vorarbeiten der Holepunch- und Beaker-Browser-Entwickler.
