import type { Client, DecodedMessage } from '@xmtp/mls-client'
import type { RedisClient } from './redis.js'
import { getSpamScore } from './spamScore.js'

export async function handleMessage(
  _client: Client,
  redis: RedisClient,
  message: DecodedMessage
) {
  const messageScore = await getSpamScore(message)
  const userScore = await redis.incrementScore(
    message.conversationId,
    message.senderInboxId,
    messageScore
  )

  if (userScore < -10) {
    console.log(
      `User ${message.senderInboxId} has a spam score of ${userScore}. Kicking them out of the group`
    )
  }
}
