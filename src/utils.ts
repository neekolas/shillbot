import { Client, type Conversation } from '@xmtp/mls-client'
import { createWalletClient, http, toBytes, type WalletClient } from 'viem'
import {
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts'
import { mainnet } from 'viem/chains'
import config from './config.js'

const CONVERSE_API_URL = 'https://backend-staging.converse.xyz/api'

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
  return `${config.dbFolder}/${env}-${walletAddress}.db3`
}

export async function buildClient(wallet: WalletClient): Promise<Client> {
  const address = wallet.account?.address
  if (!address || !wallet.account) {
    throw new Error('Missing address')
  }
  const env = config.xmtpEnv
  const dbPath = buildDbPath(address, env)
  console.log(`Creating client with DB at ${dbPath}`)
  const client = await Client.create(address, { env, dbPath })
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

export function findMemberAddresses(
  group: Conversation,
  inboxId: string
): string[] {
  const foundMember = group.members.find((member) => member.inboxId === inboxId)
  return foundMember?.accountAddresses ?? []
}

export async function getConverseProfile(
  walletAddress: string
): Promise<{ userNames: { name: string }[] }> {
  const url = `${CONVERSE_API_URL}/profile?address=${walletAddress}`
  const data = await (
    await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    })
  ).json()

  console.log(`Converse API response: ${data}`)

  return data
}
