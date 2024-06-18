import { ContentTypeText } from '@xmtp/content-type-text'
import config from './config.js'
import { randomClient } from './utils.js'

const BOT_ADDRESS = config.wallet.account!.address

const NUM_SPAM_MESSAGES = 3

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

  for (let i = 0; i < NUM_SPAM_MESSAGES; i++) {
    await boConversation.send(
      'Would you like to make money from home? Just click this link to get an airdrop.',
      ContentTypeText
    )
  }
}

main()
