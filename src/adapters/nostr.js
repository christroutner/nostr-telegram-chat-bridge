/*
  Adapter library for working with Nostr
*/

// Global dependencies
import { finalizeEvent } from 'nostr-tools/pure'
import { Relay, useWebSocketImplementation } from 'nostr-tools/relay'
import { hexToBytes } from '@noble/hashes/utils'
import WebSocket from 'ws'
useWebSocketImplementation(WebSocket)

// Relay list
// const psf = "wss://nostr-relay.psfoundation.info"
const psf = 'wss://relay.damus.io'

class NostrAdapter {
  constructor () {
    // Check env var dependencies
    this.nostrChannelId = process.env.NOSTR_CHANNEL_ID
    if (!this.nostrChannelId) {
      throw new Error('NOSTR_CHANNEL_ID is not set')
    }
    this.nostrPrivKey = process.env.BOT_NOSTR_PRIV_KEY
    if (!this.nostrPrivKey) {
      throw new Error('BOT_NOSTR_PRIV_KEY is not set')
    }

    // Bind 'this' object to all class methods.
    this.postMessage = this.postMessage.bind(this)
  }

  async postMessage (inObj = {}) {
    try {
      const { content } = inObj

      const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', this.nostrChannelId, psf, 'root']],
        content
      }

      const privKeyBin = hexToBytes(this.nostrPrivKey)
      // const pubKey = getPublicKey(privKeyBin)

      // Sign the post
      const signedEvent = finalizeEvent(eventTemplate, privKeyBin)

      // Connect to the relay
      const relay = await Relay.connect(psf)

      // Publish the message to the relay
      const result = await relay.publish(signedEvent)
      console.log('result: ', result)

      // Close the connection to the relay.
      relay.close()
    } catch (err) {
      console.error('NostrAdapter.postMessage: ', err)
      throw err
    }
  }
}

export default NostrAdapter
