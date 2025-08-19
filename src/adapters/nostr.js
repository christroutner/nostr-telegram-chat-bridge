/*
  Adapter library for working with Nostr
*/

// Global dependencies
import { finalizeEvent } from 'nostr-tools/pure'
import { Relay, useWebSocketImplementation } from 'nostr-tools/relay'
import { hexToBytes } from '@noble/hashes/utils'
import WebSocket from 'ws'
import { RelayPool } from 'nostr'

useWebSocketImplementation(WebSocket)

// Relay list
const psf = 'wss://nostr-relay.psfoundation.info'
const damus = 'wss://relay.damus.io'

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

    // Kick off the monitoring process.
    this.monitorNostrChat()
  }

  async postMessage (inObj = {}) {
    try {
      const { content } = inObj

      const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', this.nostrChannelId, damus, 'root']],
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

  // This function is run once at startup. It sets up a websocket connection to
  // relays and it monitors new entries in the chat room. If a new message is
  // received, it will rebroadcast that message to the Telegram channel.
  async monitorNostrChat () {
    try {
      const relays = [psf, damus]

      const pool = RelayPool(relays)

      // Ignore all messages for the first 3 seconds.
      const startTime = Math.floor((Date.now() + 3000) / 1000)

      const seenIds = []

      pool.on('open', relay => {
        relay.subscribe('subid', { limit: 10, kinds: [42], '#e': [this.nostrChannelId] })
      })

      // pool.on('eose', relay => {
      //   relay.close()
      // });

      pool.on('event', (relay, subId, ev) => {
        if (ev.created_at < startTime) {
          return
        }

        if (seenIds.includes(ev.id)) {
          return
        }

        seenIds.push(ev.id)

        console.log(ev)
      })
    } catch (err) {
      console.error('Error in nostr.js/monitorNostrChat(): ', err)
      throw err
    }
  }
}

export default NostrAdapter
