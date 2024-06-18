import { createClient } from 'redis'
import config from './config.js'

const buildScoreKey = (groupId: string) => `scores:${groupId}`

const buildEvictionKey = (groupId: string, inboxId: string) =>
  `evictions:${groupId}:${inboxId}`

const buildIsEvictedKey = (groupId: string, inboxId: string) =>
  `isEvicted:${groupId}:${inboxId}`

export type EvictionData = {
  messageFlagged: string
  accountAddressOrEns: string
  reason?: string
}

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

    async storeEvictionInfo(
      groupId: string,
      inboxId: string,
      evictionData: EvictionData
    ) {
      const key = buildEvictionKey(groupId, inboxId)
      await client.hSet(key, evictionData)
    },

    async getEvictionInfo(
      groupId: string,
      inboxId: string
    ): Promise<EvictionData> {
      const data = await client.hGetAll(buildEvictionKey(groupId, inboxId))
      if (!data || !data.accountAddressOrEns) {
        throw new Error('No eviction info found')
      }

      return data as EvictionData
    },

    async storeIsEvicted(groupId: string, inboxId: string) {
      const key = buildIsEvictedKey(groupId, inboxId)
      await client.set(key, 1)
    },

    async getIsEvicted(groupId: string, inboxId: string): Promise<boolean> {
      const val = await client.exists(buildIsEvictedKey(groupId, inboxId))
      return val !== 0
    },
  }
}

export type RedisClient = Awaited<ReturnType<typeof buildRedis>>
