/*
  This controller library reacts to messages coming in to the Telegram.
*/

// Public npm libraries
// import TelegramBot from 'node-telegram-bot-api'

// Private libraries
import config from '../../../config/index.js'

class TelegramController {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Telegram Bot Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Telegram Bot Controller libraries.'
      )
    }
    if (!config.telegramBotToken) {
      throw new Error('Telegram bot token is required as env var TELEGRAM_BOT_TOKEN.')
    }

    // Bind 'this' object to all methods.
    this.startTelegramBot = this.startTelegramBot.bind(this)
    this.processMsg = this.processMsg.bind(this)
  }

  startTelegramBot () {
    this.bot = this.adapters.telegram.initBot()

    // Process any messages in the chat room.
    this.bot.on('message', this.processMsg)
  }

  // Process any messages in the chat room by forwarding it on to Nostr.
  async processMsg (msg) {
    try {
      console.log('Bot received direct message: ', JSON.stringify(msg, null, 2))

      const content = `From @${msg.from.username} on Telegram:\n\n${msg.text}`

      await this.adapters.nostr.postMessage({ content })
    } catch (error) {
      console.error('Error in processMsg:', error)

      const opts = {
        reply_to_message_id: msg.message_id
      }
      this.bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your request. Please try again later.', opts)
    }
  }
}

export default TelegramController
