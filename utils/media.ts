import { Wallet } from '@ethersproject/wallet'
import { MediaFactory } from '@zoralabs/core/dist/typechain/MediaFactory'
import Decimal from '@zoralabs/core/dist/utils/Decimal'
import { BigNumber, Bytes } from 'ethers'
import { SolidityBid, SolidityAsk, MediaData } from '../utils/types'

export async function mint(mediaAddress: string, wallet: Wallet, mediaData: MediaData) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.mint(mediaData, {
    creator: Decimal.new(10),
    owner: Decimal.new(90),
    prevOwner: Decimal.new(0),
  })
  await tx.wait()
}

export async function burn(mediaAddress: string, wallet: Wallet, tokenId: BigNumber) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.burn(tokenId)
  console.log(tx)
  await tx.wait()
}

export async function updateTokenURI(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  tokenURI: string
) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.updateTokenURI(tokenId, tokenURI)
  console.log(tx)
  await tx.wait()
}

export async function updateTokenMetadataURI(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  tokenMetadataURI: string
) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.updateTokenMetadataURI(tokenId, tokenMetadataURI)
  console.log(tx)
  await tx.wait()
}

export async function totalSupply(mediaAddress: string, wallet: Wallet) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  return await media.totalSupply()
}

export async function approve(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  toAddress: string
) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.approve(toAddress, tokenId)
  console.log(tx)
  await tx.wait()
}

export async function approveForAll(
  mediaAddress: string,
  wallet: Wallet,
  operator: string,
  approved: boolean
) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.setApprovalForAll(operator, approved)
  console.log(tx)
  await tx.wait()
}

export async function transfer(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  to: string
): Promise<string> {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.transferFrom(wallet.address, to, tokenId)
  await tx.wait()
  return tx.hash
}

export async function setAsk(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  ask: SolidityAsk
) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.setAsk(tokenId, ask)
  console.log(tx)
  await tx.wait()
}

export async function removeAsk(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber
) {
  const media = await MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.removeAsk(tokenId)
  console.log(tx)
  await tx.wait()
}

export async function setBid(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  bid: SolidityBid
) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.setBid(tokenId, bid)
  console.log(tx)
  await tx.wait()
}

export async function removeBid(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber
) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.removeBid(tokenId)
  console.log(tx)
  await tx.wait()
}

export async function acceptBid(
  mediaAddress: string,
  wallet: Wallet,
  tokenId: BigNumber,
  bid: SolidityBid
) {
  const media = MediaFactory.connect(mediaAddress, wallet)
  const tx = await media.acceptBid(tokenId, bid)
  console.log(tx)
  await tx.wait()
}
