import { ContentTypeText } from '@xmtp/content-type-text'
import type { Client, Conversation, DecodedMessage } from '@xmtp/mls-client'
import config from './config.js'
import type { RedisClient } from './redis.js'
import { getSpamScore } from './spamScore.js'
import { findMemberAddresses, getConverseProfile } from './utils.js'

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

async function tryResolveAddress(address: string): Promise<string> {
  try {
    const profileData = await getConverseProfile(address)
    if (profileData?.userNames?.length) {
      return profileData.userNames[0].name
    }
  } catch (e) {
    console.error(`Failed to resolve address ${address}`, e)
  }
  return address
}

export async function beginEviction(
  client: Client,
  redis: RedisClient,
  messageFlagged: DecodedMessage
) {
  const groupId = messageFlagged.conversationId
  const memberInboxId = messageFlagged.senderInboxId

  const group = client.conversations.get(groupId)
  if (!group) {
    throw new Error('Failed to get a group')
  }
  const addresses = findMemberAddresses(group, memberInboxId)
  if (!addresses.length) {
    throw new Error('Failed to get member addreseses')
  }
  const primaryMember = addresses[0]

  redis.storeEvictionInfo(groupId, memberInboxId, {
    messageFlagged: messageFlagged.content,
    accountAddressOrEns: await tryResolveAddress(primaryMember),
  })

  await group.send(
    `User is flagged for eviction from group: ${config.frameUrlRoot}/evict?groupId=${groupId}&memberId=${memberInboxId}`,
    ContentTypeText
  )
}

export async function handleMessage(
  client: Client,
  redis: RedisClient,
  message: DecodedMessage
) {
  if (message.senderInboxId === client.inboxId) {
    console.log('Skipping message sent by bot')
    return
  }
  const messageScore = await getSpamScore(message)
  const userScore = await redis.incrementScore(
    message.conversationId,
    message.senderInboxId,
    messageScore.score
  )

  console.log(`Message has a SPAM score of ${messageScore} giving the user an overall score of ${userScore}.
  Message: ${message.content}`)

  if (userScore < -10) {
    console.log(
      `User ${message.senderInboxId} has a spam score of ${userScore}. Kicking them out of the group`
    )
    await beginEviction(client, redis, message)
  }
}

export async function handleNewGroup(client: Client, group: Conversation) {
  console.log(`Joined a new conversation. ${group.id}`)
}
