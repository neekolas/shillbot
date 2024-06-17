import dotenv from 'dotenv'
import type { WalletClient } from 'viem'
import { requireEnv, walletClientFromMnemonic } from './utils.js'

dotenv.config()

export type Config = {
  wallet: WalletClient
  redisUrl: string
}

const buildConfig = (): Config => {
  const mnemonic = requireEnv('WALLET_MNEMONIC')

  return {
    wallet: walletClientFromMnemonic(mnemonic),
    redisUrl: requireEnv('REDIS_URL'),
  }
}

export default buildConfig()
