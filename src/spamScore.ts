import type { DecodedMessage } from '@xmtp/mls-client'

export async function getSpamScore(_message: DecodedMessage): Promise<number> {
  return 0
}
