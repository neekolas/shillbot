import { type DecodedMessage } from '@xmtp/mls-client'
import { getSpamScore } from './spamScore.js'

const prompts = [
  {
    text: 'Join our community to learn more about blockchain technology and its applications.',
    score: 5,
  },
  {
    text: "Congratulations! You've won a $1000 gift card. Click here to claim your prize.",
    score: -9,
  },
  {
    text: 'Check out this new decentralized application that allows secure and private transactions.',
    score: 3,
  },
  {
    text: 'Urgent! Your account has been compromised. Click here to secure your account.',
    score: -10,
  },
  {
    text: 'Participate in our free webinar on the latest trends in cryptocurrency.',
    score: 5,
  },
  {
    text: 'Get rich quick! Invest in our new token and see returns of 200% in just a week.',
    score: -8,
  },
  {
    text: 'Learn about the benefits of using smart contracts in business.',
    score: 6,
  },
  {
    text: 'Act now! Limited time offer to buy our exclusive NFT collection.',
    score: -7,
  },
  {
    text: 'Our platform provides secure and transparent peer-to-peer lending.',
    score: 5,
  },
  {
    text: 'Win a free vacation by entering your details on this website.',
    score: -9,
  },
  {
    text: 'Join our open-source project to contribute to blockchain development.',
    score: 8,
  },
  {
    text: 'Exclusive pre-sale for our new cryptocurrency token. Limited slots available.',
    score: -6,
  },
  {
    text: 'Learn how to protect your digital assets from cyber threats.',
    score: 7,
  },
  { text: 'Claim your free tokens by signing up on our website.', score: -8 },
  {
    text: 'Discover the advantages of decentralized finance (DeFi) solutions.',
    score: 6,
  },
  {
    text: 'Immediate action required! Verify your account to avoid suspension.',
    score: -9,
  },
  {
    text: 'Join our hackathon to develop innovative blockchain solutions.',
    score: 9,
  },
  {
    text: "Invest in our new ICO with guaranteed returns. Don't miss out!",
    score: -7,
  },
  {
    text: 'Learn about the environmental impact of cryptocurrency mining.',
    score: 8,
  },
  {
    text: 'Get exclusive access to our new crypto trading platform. Sign up now!',
    score: -4,
  },
  {
    text: 'Participate in our survey and get a chance to win free crypto.',
    score: -2,
  },
  {
    text: 'Join our meetup to network with blockchain professionals.',
    score: 5,
  },
  { text: 'Beware of phishing scams asking for your private keys.', score: 10 },
  { text: 'Buy our new token at a discount before it goes public.', score: -7 },
  { text: 'Learn how to develop smart contracts on Ethereum.', score: 7 },
]

const assert = (value: boolean, message: string) => {
  if (!value) {
    throw new Error(message)
  }
}

const testShill = async (prompt: { text: string; score: number }) => {
  const message: DecodedMessage = {
    content: prompt.text,
    sender: 'test',
    timestamp: new Date().toISOString(),
    contentType: {
      typeId: 'text',
    },
  } as unknown as DecodedMessage
  console.log(`Testing message: "${prompt.text}"`)
  const result = await getSpamScore(message)
  assert(typeof result.score === 'number', 'Expected a number for score')
  const score = Math.abs(prompt.score - result.score)
  assert(score <= 2, `Expected score ${prompt.score} but got ${result.score}`)
}

for (const prompt of prompts) {
  await testShill(prompt)
}
