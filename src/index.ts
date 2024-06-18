import config from './config.js'
import { createFrameServer } from './frame.js'
import { handleMessage, handleNewGroup } from './handler.js'
import { buildRedis } from './redis.js'
import { buildClient } from './utils.js'

async function main() {
  const client = await buildClient(config.wallet)
  const redis = await buildRedis()

  const _frame = await createFrameServer(redis, client)

  console.log(`Listening to inbox: ${client.inboxId}`)
  await client.conversations.sync()

  client.conversations.stream((error, convo) => {
    if (error) {
      console.error('Error streaming group', error)
      return
    }
    handleNewGroup(client, convo)
  })

  client.conversations.streamAllMessages((error, message) => {
    if (error) {
      console.warn(`Stream error: ${error}`)
      return
    }
    try {
      handleMessage(client, redis, message)
    } catch (e) {
      console.error('Error handling message', e)
    }
  })
}

main()
