import { createClient } from 'redis'
import config from './config.js'

const buildScoreKey = (groupId: string) => `scores:${groupId}`

export async function buildRedis() {
  const client = createClient({
    url: config.redisUrl,
  })

  await client.connect()

  return {
    client,

    async getScore(groupId: string, inboxId: string): Promise<number> {
      const val = await client.hGet(buildScoreKey(groupId), inboxId)
      if (!val) {
        return 0
      }
      return parseInt(val)
    },

    async incrementScore(
      groupId: string,
      inboxId: string,
      amount: number
    ): Promise<number> {
      return client.hIncrBy(buildScoreKey(groupId), inboxId, amount)
    },
  }
}

export type RedisClient = Awaited<ReturnType<typeof buildRedis>>
