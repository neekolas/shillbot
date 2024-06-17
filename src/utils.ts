import os from 'os'
import { Client } from '@xmtp/mls-client'
import { createWalletClient, http, toBytes, type WalletClient } from 'viem'
import {
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts'
import { mainnet } from 'viem/chains'

export function walletClientFromMnemonic(mnemonic: string): WalletClient {
  const account = mnemonicToAccount(mnemonic)
  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  })
}

export function randomWallet(): WalletClient {
  const pk = generatePrivateKey()

  return createWalletClient({
    account: privateKeyToAccount(pk),
    chain: mainnet,
    transport: http(),
  })
}

export async function randomClient(): Promise<Client> {
  const wallet = randomWallet()
  return buildClient(wallet)
}

function buildDbPath(walletAddress: string, env: string): string {
  return `${os.tmpdir()}/${env}-${walletAddress}.db3`
}

export async function buildClient(wallet: WalletClient): Promise<Client> {
  const address = wallet.account?.address
  if (!address || !wallet.account) {
    throw new Error('Missing address')
  }
  // TODO: don't use tempdir in production
  const dbPath = buildDbPath(address, 'dev')
  console.log(`Creating client with DB at ${dbPath}`)
  const client = await Client.create(address, { env: 'dev', dbPath })
  if (!client.isRegistered && client.signatureText) {
    const signature = await wallet.signMessage({
      account: wallet.account,
      message: client.signatureText,
    })
    client.addEcdsaSignature(toBytes(signature))
    await client.registerIdentity()
  }
  return client
}

export function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val || !val.length) {
    throw new Error(`Missing key ${key}`)
  }
  return val
}

export function requireIntEnv(key: string): number {
  return parseInt(requireEnv(key))
}
