import { ContentTypeText } from '@xmtp/content-type-text'
import config from './config.js'
import { randomClient } from './utils.js'

const BOT_ADDRESS = config.wallet.account!.address

export async function main() {
  const alix = await randomClient()
  const bo = await randomClient()

  const alixGroup = await alix.conversations.newConversation(
    [bo.accountAddress.toLowerCase(), BOT_ADDRESS.toLowerCase()],
    { permissions: 0 }
  )

  await bo.conversations.sync()
  await bo.conversations.list()
  const boConversation = bo.conversations.get(alixGroup.id)
  if (!boConversation) {
    throw new Error('boConversation not found')
  }

  for (let i = 0; i < 11; i++) {
    await boConversation.send('Hello, world!', ContentTypeText)
  }
}

main()
