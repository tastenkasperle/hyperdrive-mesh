import Hyperswarm from 'hyperswarm'

/**
 * Verbindet einen Corestore mit dem Hyperswarm DHT Netzwerk
 */
export class MeshSwarm {
  constructor(store, opts = {}) {
    this.store = store
    this.swarm = new Hyperswarm(opts)
    this.peers = new Set()
    
    // Automatische P2P-Replikation über den Corestore
    this.swarm.on('connection', (connection, peerInfo) => {
      this.peers.add(connection)
      this.store.replicate(connection)
      
      connection.on('close', () => {
        this.peers.delete(connection)
      })
    })
  }

  async join(discoveryKey, { server = true, client = true } = {}) {
    const discovery = this.swarm.join(discoveryKey, { server, client })
    await discovery.flushed()
    return discovery
  }

  get peerCount() {
    return this.peers.size
  }

  async destroy() {
    await this.swarm.destroy()
  }
}
