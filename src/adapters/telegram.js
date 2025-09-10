/*
  Adapter library for connecting, sending, and receiving messages from Telegram.
*/

// Global dependencies
import TelegramBot from 'node-telegram-bot-api'

// Local libraries
import config from '../../config/index.js'

class TelegramAdapter {
  constructor () {
    // Check env var dependencies
    this.chatId = process.env.CHATID
    if (!this.chatId) {
      throw new Error('CHATID is not set')
    }

    // Bind 'this' object to all methods.
    this.initBot = this.initBot.bind(this)
  }

  // Initialize the telegram chat bot.
  initBot () {
    try {
      this.bot = new TelegramBot(config.telegramBotToken, {
        polling: true,
        request: {
          agentOptions: {
            keepAlive: true,
            family: 4
          }
        }
      })

      return this.bot
    } catch (err) {
      console.error('Error in adapters/telegram.js/initBot(): ', err)
      throw err
    }
  }

  async sendMessage (inObj = {}) {
    try {
      const { message } = inObj
      console.log('message: ', message)

      // Ignore if the message originated from the bot.
      const botPubKey = process.env.BOT_NOSTR_PUB_KEY
      if (message.pubkey === botPubKey) {
        return
      }

      // Create pubkey summary
      // TODO: convert from pubkey to npub.
      const firstFourCharacters = message.pubkey.substring(0, 4)
      const lastFourCharacters = message.pubkey.substring(message.pubkey.length - 4)
      const pubkeySummary = `${firstFourCharacters}...${lastFourCharacters}`

      await this.bot.sendMessage(this.chatId, `From Nostr user ${pubkeySummary}:\n\n${message.content}`)
    } catch (err) {
      console.error('Error in adapters/telegram.js/sendMessage(): ', err)
      throw err
    }
  }
}

export default TelegramAdapter
