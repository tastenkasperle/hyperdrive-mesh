# 💎 Diamantenschmiede – Projekt-Spezifikation (SPEC-01)
# HyperDrive Mesh (Headless P2P Storage & MCP Server)

[![Architecture: Modular Node.js](https://img.shields.io/badge/Architecture-Modular%20ESM-F7DF1E.svg?logo=javascript)](https://nodejs.org)
[![Engine: Hypercore Protocol v10](https://img.shields.io/badge/Engine-Hyperdrive%20%7C%20Hyperswarm-FF4081.svg)](https://hypercore-protocol.org/)
[![Protocol: Model Context Protocol](https://img.shields.io/badge/Protocol-MCP%20Ready-6C5CE7.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 1. 🎯 Executive Summary & Mission

**HyperDrive Mesh** ist eine schlanke, 100 % dezentrale und lokale Peer-to-Peer Dateisystem- und Speicher-Engine mit nativer **Model Context Protocol (MCP)** Unterstützung für autonome KI-Agenten und Multi-Maschinen-Setups.

### Der historische Kontext (Die Rettung aus der Diamantenmine):
Dieses Projekt entstand im Rahmen der **Operation Deep Mine** als experimentelle Fallstudie für **Spec-Driven Multi-Agent Engineering**:
* **Die Vorarbeit:** Das Team hinter dem [Beaker Browser](https://github.com/beakerbrowser/beaker) (~6.7k Stars) leistete Pionierarbeit mit dem Hypercore/Hyperdrive-Protokoll für dezentrales Web-Hosting und echtzeitfähige P2P-Ordner.
* **Der Flaschenhals (Der Korken):** Die brillante P2P-Technologie wurde in einem monolithischen, proprietären Electron-Webbrowser eingesperrt. Als die Finanzierung ausging und die Nutzer keinen neuen Browser adaptieren wollten, wurde das Projekt 2022 archiviert.
* **Unser Refinement-Hebel:** Wir haben den gesamten Electron- und Browser-Ballast abgeschnitten und den kryptografischen Kern isoliert. Das Ergebnis ist ein universeller, ressourcenschonender Headless-Daemon, der sich nahtlos in moderne KI-Workflows einfügt.

---

## 2. 🏛️ Architektur & Modul-Design

Das System folgt strikter **Separation of Concerns (SoC)** als reines ES-Modul (Node.js 20+):

```text
diamantenschmiede/hyperdrive_mesh/
├── package.json               # Paket-Definition & Skripte
├── SPEC.md                    # Diese Spezifikation
├── README.md                  # Öffentliche Dokumentation & Case Study
├── .gitignore                 # Schutz von Keys, Storage & node_modules
├── src/
│   ├── index.mjs              # Haupteinstiegspunkt
│   ├── core/
│   │   ├── storage.mjs        # Corestore-Initialisierung & Persistenz
│   │   ├── drive.mjs          # Hyperdrive CRUD, Sparse Sync & Snapshot Engine
│   │   └── swarm.mjs          # Hyperswarm DHT Discovery, Connection Pooling & NAT-Traverse
│   ├── cli/
│   │   ├── index.mjs          # CLI Router
│   │   ├── cmd_init.mjs       # Drive initialisieren / Key generieren
│   │   ├── cmd_share.mjs      # Lokalen Ordner in den P2P-Schwarm seeden
│   │   ├── cmd_sync.mjs       # Remote Drive via P2P-Key lokal mounten/spiegeln
│   │   └── cmd_status.mjs     # Aktive Peers, Bandbreite & Schwarm-Statistik
│   └── mcp/
│       ├── server.mjs         # Stdio MCP Server Implementierung
│       └── tools.mjs          # Agent-Tools (p2p_put, p2p_get, p2p_sync, p2p_snapshot)
└── tests/
    ├── test_core_drive.mjs    # Lokaler CRUD- & Key-Test
    ├── test_p2p_replication.mjs # 2-Peers In-Memory Replication Test
    └── test_mcp_interface.mjs # Validierung der MCP Stdio Schnittstelle
```

---

## 3. ⚙️ Kern-Funktionalitäten

### A. Sparse Content-Streaming (vs. Syncthing)
* Lädt Daten nicht starr blockweise auf die Festplatte, sondern streamt genau die Bytes on-demand, die ein Agent anfordert.
* Ermöglicht das Teilen von Gigabyte-großen Repositories, während ein Agent auf einem Edge-Node nur eine 4 KB Konfigurationsdatei liest.

### B. Time-Travel & Snapshot Versioning
* Jeder Schreibvorgang wandert in ein kryptografisches Append-Only Log.
* Agenten können atomare Checkpoints erstellen und historische Zustände inspizieren:
  ```javascript
  const historicalDrive = drive.checkout(version)
  const pastConfig = await historicalDrive.get('/config.json')
  ```

### C. Zero-Cloud P2P Schwarm
* End-to-End verschlüsselt via Noise Protocol.
* Automatisches NAT-Holepunching über Hyperswarm DHT. Keine Portfreigaben am Router oder feste IPs nötig.

---

## 4. 🤖 MCP-Werkzeuge für KI-Agenten

Der integrierte MCP-Server stellt folgende Tools über `stdio` bereit:

1. **`p2p_drive_create`**: Erstellt ein neues P2P-Drive und liefert den hexadezimalen Public-Key zurück.
2. **`p2p_drive_share`**: Teilt einen lokalen Pfad im Schwarm und schützt ihn optional mit Schreibrechten.
3. **`p2p_drive_pull`**: Verbindet sich mit einem Remote-Key und synchronisiert spezifische Dateien oder ganze Verzeichnisse.
4. **`p2p_file_read` / `p2p_file_write`**: Liest und schreibt direkt im kryptografischen Virtual File System.
5. **`p2p_snapshot_create`**: Erzeugt einen versionierten Restore-Point für Multi-Agenten-Transaktionen.

---

## 5. 🐺 Case Study Leitplanken (Whisper-Pill-Standard)

In der Dokumentation und im Code werden folgende Grundsätze strikt eingehalten:
1. **Kein Vibe-Coding:** Jeder Schritt wird testgetrieben verifiziert (`tests/`).
2. **Standard-Nutzer Kompatibilität:** Läuft portabel ohne Windows-Admin-Rechte, ohne Registry-Eingriffe und ohne C++ Compiler-Zwänge.
3. **Open-Source Attribution:** Klare Nennung der historischen Wurzeln (Paul Frazee, Beaker Browser, Holepunch/Hypercore-Team) mit klarer Abgrenzung unserer Optimierung.
