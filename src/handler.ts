import type { DecodedMessage } from '@xmtp/mls-client'
import type { RedisClient } from './redis.js'
import { getSpamScore } from './spamScore.js'

export async function handleMessage(
  message: DecodedMessage,
  redis: RedisClient
) {
  const spamScore = await getSpamScore(message)
  redis.incrementScore(message.conversationId, message.senderInboxId, spamScore)
}
