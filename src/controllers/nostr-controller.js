/*
  Controller (input) library for handling messages coming in from Nostr.
*/

// Global dependencies
// import { finalizeEvent } from 'nostr-tools/pure'
// import { Relay, useWebSocketImplementation } from 'nostr-tools/relay'
// import { hexToBytes } from '@noble/hashes/utils'
// import WebSocket from 'ws'
import { RelayPool } from 'nostr'

// useWebSocketImplementation(WebSocket)

// Relay list
const psf = 'wss://nostr-relay.psfoundation.info'
const damus = 'wss://relay.damus.io'

class NostrController {
  constructor (localConfig = {}) {
    // Check env var dependencies
    this.nostrChannelId = process.env.NOSTR_CHANNEL_ID
    if (!this.nostrChannelId) {
      throw new Error('NOSTR_CHANNEL_ID is not set')
    }
    this.nostrPrivKey = process.env.BOT_NOSTR_PRIV_KEY
    if (!this.nostrPrivKey) {
      throw new Error('BOT_NOSTR_PRIV_KEY is not set')
    }

    // Dependency injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Nostr Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Nostr Controller libraries.'
      )
    }

    // Bind 'this' object to all methods.
    this.startNostrMonitor = this.startNostrMonitor.bind(this)
  }

  // Monitor the Nostr chat room for new messages.
  async startNostrMonitor () {
    try {
      const relays = [psf, damus]

      const pool = RelayPool(relays)

      // Ignore all messages for the first 3 seconds.
      const startTime = Math.floor((Date.now() + 3000) / 1000)

      const seenIds = []

      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 10, kinds: [42], '#e': [this.nostrChannelId] })
      })

      // Do not close the connection to the relays. Keep it open forever to
      // monitor for new chat messages.
      // pool.on('eose', relay => {
      //   relay.close()
      // });

      pool.on('event', async (relay, subId, ev) => {
        if (ev.created_at < startTime) {
          return
        }

        if (seenIds.includes(ev.id)) {
          return
        }

        seenIds.push(ev.id)

        console.log('NostrController.startNostrMonitor(): ', ev)

        // Forward the message to the Telegram channel.
        await this.adapters.telegram.sendMessage({ message: ev })
      })
    } catch (err) {
      console.error('Error in nostr-controller.js/startNostrMonitor(): ', err)
      throw err
    }
  }
}

export default NostrController
