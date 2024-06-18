import type { Client, Conversation, DecodedMessage } from '@xmtp/mls-client'
import type { RedisClient } from './redis.js'
import { getSpamScore } from './spamScore.js'

export async function evictMember(
  client: Client,
  groupId: string,
  memberInboxId: string
): Promise<void> {
  const group = client.conversations.get(groupId)
  if (!group) {
    throw new Error('Group not found')
  }
  await group.removeMembersByInboxId([memberInboxId])
}

export async function handleMessage(
  client: Client,
  redis: RedisClient,
  message: DecodedMessage
) {
  console.log(
    `Handling message ${message.content} with id ${message.id}. Sender inbox: ${message.senderInboxId}`
  )
  const messageScore = await getSpamScore(message)
  const userScore = await redis.incrementScore(
    message.conversationId,
    message.senderInboxId,
    messageScore.score
  )

  if (userScore < -10) {
    console.log(
      `User ${message.senderInboxId} has a spam score of ${userScore}. Kicking them out of the group`
    )
    evictMember(client, message.conversationId, message.senderInboxId)
  }
}

export async function handleNewGroup(client: Client, group: Conversation) {
  console.log(`Joined a new conversation. ${group.id}`)
}
