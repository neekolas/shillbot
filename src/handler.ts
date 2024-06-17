import type { DecodedMessage } from '@xmtp/mls-client'
import { getSpamScore } from './spamScore.js'

export async function handleMessage(
  message: DecodedMessage,
  redis: RedisClient
) {
  const spamScore = await getSpamScore(message)
}
