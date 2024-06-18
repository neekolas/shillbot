import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { validateFramesPost } from '@xmtp/frames-validator'
import type { Client } from '@xmtp/mls-client'
import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import type { Context, Next } from 'hono'
import { evictMember } from './handler.js'
import type { RedisClient } from './redis.js'

const addMetaTags = (client: string, version?: string) => {
  // Follow the OpenFrames meta tags spec
  return {
    unstable_metaTags: [
      { property: `of:accepts`, content: version || 'vNext' },
      { property: `of:accepts:${client}`, content: version || 'vNext' },
    ],
  }
}

const xmtpSupport = async (c: Context, next: Next) => {
  console.log('Request Method:', c.req.method) // Add this line to log the request method
  // Check if the request is a POST and relevant for XMTP processing
  if (c.req.method === 'POST') {
    const requestBody = (await c.req.json().catch(() => {})) || {}
    console.log('Request Body:', requestBody) // Add this line to log the request body

    if (requestBody?.clientProtocol?.includes('xmtp')) {
      c.set('client', 'xmtp')
      const { verifiedWalletAddress } = await validateFramesPost(requestBody)
      c.set('verifiedWalletAddress', verifiedWalletAddress)
      console.log('verifiedWalletAddress', verifiedWalletAddress)
    } else {
      // Add farcaster check
      c.set('client', 'farcaster')
    }
  }
  await next()
}

const choices = ['Evict', 'Keep']

export async function createFrameServer(
  redis: RedisClient,
  xmtpClient: Client
) {
  const app = new Frog(addMetaTags('xmtp'))

  app.use(xmtpSupport)

  app.use('/*', serveStatic({ root: './public' }))

  app.frame('/evict/:groupId/:memberId', async (c) => {
    const { buttonValue, status } = c
    const groupId = c.req.param('groupId')
    const memberId = c.req.param('memberId')
    const evictionData = await redis.getEvictionInfo(
      groupId as string,
      memberId as string
    )
    let isEvicted = false
    if (typeof groupId === 'string' && typeof memberId && 'string') {
      isEvicted = await redis.getIsEvicted(
        groupId as string,
        memberId as string
      )
    }
    const { accountAddressOrEns: memberDisplayName, groupName } = evictionData
    const choice = buttonValue

    // XMTP verified address
    const { verifiedWalletAddress } = c?.var || {}
    console.log(
      `Request from ${verifiedWalletAddress}. Choice: ${choice}. Status: ${status}`
    )

    if (
      status === 'response' &&
      choice === 'Evict' &&
      !isEvicted &&
      typeof groupId === 'string' &&
      typeof memberId === 'string'
    ) {
      evictMember(xmtpClient, groupId, memberId, redis)
    }

    let intents = choices.map((choice) => (
      <Button value={choice}>{choice}</Button>
    ))

    if (isEvicted) {
      intents = [<Button.Reset>Ok</Button.Reset>]
    }

    return c.res({
      image: (
        <div
          style={{
            alignItems: 'center',
            background:
              status === 'response'
                ? 'linear-gradient(to right, #432889, #17101F)'
                : 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
              display: 'flex',
            }}
          >
            {isEvicted &&
              status !== 'response' &&
              `User ${memberDisplayName} has been evicted from ${groupName}`}
            {!isEvicted &&
              status === 'response' &&
              choice === 'Evict' &&
              `You've choosen to evict ${memberDisplayName} from ${groupName}`}
            {!isEvicted &&
              status === 'response' &&
              choice === 'Keep' &&
              `You've choosen to keep ${memberDisplayName} from ${groupName}`}
            {!isEvicted &&
              status === 'response' &&
              `Evict ${memberId} from ${groupId}?`}
          </div>
        </div>
      ),
      intents,
    })
  })

  devtools(app, { serveStatic })

  serve({
    fetch: app.fetch,
    port: 3000,
  })

  return app
}
