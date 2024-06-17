import os from 'os'
import type { XmtpEnv } from '@xmtp/mls-client'
import dotenv from 'dotenv'
import type { WalletClient } from 'viem'
import { requireEnv, walletClientFromMnemonic } from './utils.js'

dotenv.config()

export type Config = {
  dbFolder: string
  wallet: WalletClient
  redisUrl: string
  xmtpEnv: XmtpEnv
}

const getXmtpEnv = () => {
  const processEnvValue = process.env.XMTP_ENV
  if (
    processEnvValue &&
    ['local', 'dev', 'production'].includes(processEnvValue)
  ) {
    return processEnvValue as XmtpEnv
  }
  return 'dev'
}

const buildConfig = (): Config => {
  const mnemonic = requireEnv('WALLET_MNEMONIC')

  return {
    xmtpEnv: getXmtpEnv(),
    dbFolder: process.env.DB_FOLDER || os.tmpdir(),
    wallet: walletClientFromMnemonic(mnemonic),
    redisUrl: requireEnv('REDIS_URL'),
  }
}

export default buildConfig()
