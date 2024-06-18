import type { DecodedMessage } from '@xmtp/mls-client'
import { OpenAI } from 'openai'
import { requireEnv } from './utils.js'

const openai = new OpenAI({
  apiKey: requireEnv('OPEN_AI_API_KEY'),
})

const extractMessage = (message: DecodedMessage) => {
  return message.content
}

const trainingDataMessage1 = `The following message should be marked with -10 as it is a scam: "Congrats- You received $100,000 USDC in $SHIB from COINBASE. To claim your voucher, please visit the follwoing link: https://shibainu.fyi/\n NOTE: You can claim using any Wallet of choice. Ignore Coinbase WARNING when visiting the website. This Restriction is placed as offer is limited to selected WINNERS \n\n This offer will expire in 48 hours."`
const trainingDataMessage2 = `The following message should be marked with -10 as it is a scam: "XMTP Airdrop | Season 3\n\n Discover this season's ETH claim opportunity at https://xmtp.us \n\n Total ETH for Claim: 1788,29\n\n Claim Period: From midnight GMT on January 1st to midnight GMT on January 25th.\n\n Stay Updated and ready to claim your ETH with https://xmtp.us!"`
const trainingDataMessage3 = `The following message should be marked with 0 as it doesn't provide much value to the community: "gm"`
const trainingDataMessage4 = `The following message should be marked with 0 as it doesn't provide much value to the current community: "Check out this new decentralized application that allows secure and private transactions."`
const trainingDataMessage5 = `The following message should be marked with 7 as it provides value to the current community: "Check out this new decentralized application that uses our secure and private transactions network."`
const trainingDataMessage6 = `The following message should be marked with -7 as it is pushing users to act instantly or in a hurried fashion: "Act now! Limited time offer to buy our exclusive NFT collection."`
const trainingDataMessage7 = `The following message should be marked with -9 as it is a scam: "Immediate action required! Verify your account to avoid suspension."`

const getTextSpamScore = async (message: DecodedMessage) => {
  const messageText = extractMessage(message)
  const prompt = `Analyze the following message and provide a score between -10 and 10. A score of 10 means the message is very useful for the community, and a score of -10 means it is obviously a scam. Provide a brief explanation for your score. If you feel context is missing it is better to err on the side of caution and drop the score lower.`
  const mess = `Message: "${messageText}"\n\nScore (between -10 and 10):\n\nExplanation:`
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        content: prompt,
        role: 'user',
      },
      {
        content: trainingDataMessage1,
        role: 'user',
      },
      {
        content: trainingDataMessage2,
        role: 'user',
      },
      {
        content: trainingDataMessage3,
        role: 'user',
      },
      {
        content: trainingDataMessage4,
        role: 'user',
      },
      {
        content: trainingDataMessage5,
        role: 'user',
      },
      {
        content: trainingDataMessage6,
        role: 'user',
      },
      {
        content: trainingDataMessage7,
        role: 'user',
      },
      {
        content: mess,
        role: 'system',
      },
    ],
    // max_tokens: 150,
    temperature: 0.7,
  })

  const text = response.choices[0].message.content?.trim()
  if (!text) {
    return {
      score: 0,
      explanation: 'No response from the model',
    }
  }
  console.log(text)

  const [scoreLine, ...explanationLines] = text.split('\n')
  const score = parseInt(scoreLine.split(':')[1].trim())
  const explanation = explanationLines.join(' ').trim()
  return { score, explanation }
}

const getReactionSpamScore = async (_message: DecodedMessage) => {
  return {
    score: 0,
    explanation: 'Reactions are not analyzed for spam',
  }
}

export async function getSpamScore(message: DecodedMessage) {
  try {
    if (message.contentType.typeId.includes('text')) {
      return getTextSpamScore(message)
    } else if (message.contentType.typeId.includes('image')) {
      return {
        score: 0,
        explanation: 'Images are not analyzed for spam',
      }
    } else if (message.contentType.typeId.includes('reaction')) {
      return getReactionSpamScore(message)
    }
    return {
      score: 0,
      explanation: 'Videos are not analyzed for spam',
    }
  } catch (error) {
    console.error(error)
    return {
      score: 0,
      explanation: 'Error while analyzing the message',
    }
  }
}
