import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { validateFramesPost } from '@xmtp/frames-validator'
import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import type { Context, Next } from 'hono'
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

export async function createFrameServer(_redis: RedisClient) {
  const app = new Frog(addMetaTags('xmtp'))

  app.use(xmtpSupport)

  app.use('/*', serveStatic({ root: './public' }))

  app.frame('/evict', (c) => {
    const { buttonValue, inputText, status } = c
    const groupId = c.req.query('groupId')
    const memberId = c.req.query('memberId')
    const fruit = inputText || buttonValue

    // XMTP verified address
    const { verifiedWalletAddress } = c?.var || {}
    console.log('verifiedWalletAddress', verifiedWalletAddress)

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
            }}
          >
            {status === 'response'
              ? `Nice choice.${fruit ? ` ${fruit.toUpperCase()}!!` : ''}`
              : `Evicting ${memberId} from ${groupId}`}
          </div>
        </div>
      ),
      intents: [
        <Button value="apples">Apples</Button>,
        <Button value="oranges">Oranges</Button>,
        <Button value="bananas">Bananas</Button>,
        status === 'response' && <Button.Reset>Reset</Button.Reset>,
      ],
    })
  })

  devtools(app, { serveStatic })

  serve({
    fetch: app.fetch,
    port: 3000,
  })

  return app
}
