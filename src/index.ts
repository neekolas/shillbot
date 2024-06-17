import config from './config.js'
import { buildRedis } from './redis.js'
import { buildClient } from './utils.js'

async function main() {
  const client = await buildClient(config.wallet)
  const _redis = await buildRedis()

  client.conversations.stream((error, convo) => {
    if (error) {
      console.error('Error streaming group', error)
      return
    }
    console.log(`New conversation: ${convo.id}`)
  })

  client.conversations.streamAllMessages((error, message) => {
    if (error) {
      console.warn(`Stream error: ${error}`)
      return
    }
    console.log(message.id)
  })
}

main()
