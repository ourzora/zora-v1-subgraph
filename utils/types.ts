import { BigNumberish, Bytes } from 'ethers'

export type SolidityAsk = {
  currency: string
  amount: BigNumberish
}

export type SolidityBid = {
  currency: string
  amount: BigNumberish
  sellOnShare: { value: BigNumberish }
  bidder: string
  recipient: string
}

export type MediaData = {
  tokenURI: string
  metadataURI: string
  contentHash: Bytes
  metadataHash: Bytes
}
