import { BigInt } from '@graphprotocol/graph-ts/index'

export interface User {
  id: string
  creations: Array<Media>
  collection: Array<Media>
  authorizedUsers: Array<User>
  currentBids: Array<Bid>
}

export interface UsersQueryResponse {
  users: Array<User>
}

export interface UserQueryResponse {
  user: User
}

export interface Media {
  id: string
  contentHash: string
  contentURI: string
  metadataHash: string
  metadataURI: string
  creator: Media
  owner: Media
  prevOwner: Media
  approved: User
  currentAsk: Ask
  currentBids: Array<Bid>
  inactiveBids: Array<InactiveBid>
  inactiveAsks: Array<InactiveAsk>
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
  burnedAtTimestamp: BigInt
  burnedAtBlockNumber: BigInt
}

export interface MediaQueryResponse {
  media: Media
}

export interface MediasQueryResponse {
  medias: Array<Media>
}

export interface Bid {
  id: string
  media: Media
  amount: BigInt
  currency: Currency
  sellOnShare: BigInt
  bidder: User
  recipient: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
}

export interface BidQueryResponse {
  bid: Bid
}

export interface BidsQueryResponse {
  bids: Array<Bid>
}

export interface Ask {
  id: string
  media: Media
  amount: BigInt
  currency: Currency
  owner: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
}

export interface AskQueryResponse {
  ask: Ask
}

export interface AsksQueryResponse {
  asks: Array<Ask>
}

export interface InactiveAsk {
  id: string
  type: string
  media: Media
  amount: BigInt
  currency: Currency
  owner: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
  inactivatedAtTimestamp: BigInt
  inactivatedAtBlockNumber: BigInt
}

export interface InactiveAskQueryResponse {
  inactiveAsk: InactiveAsk
}

export interface InactiveAsksQueryResponse {
  inactiveAsks: Array<InactiveAsk>
}

export interface InactiveBid {
  id: string
  type: string
  media: Media
  amount: BigInt
  currency: Currency
  sellOnShare: BigInt
  bidder: User
  recipient: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
  inactivatedAtTimestamp: BigInt
  inactivatedAtBlockNumber: BigInt
}

export interface InactiveBidQueryResponse {
  inactiveBid: InactiveBid
}

export interface InactiveBidsQueryResponse {
  inactiveBids: Array<InactiveBid>
}

export interface Currency {
  id: string
  name: string
  symbol: string
  decimals: number
  liquidity: BigInt
}

export interface CurrencyQueryResponse {
  currency: Currency
}

export interface Transfer {
  id: string
  media: Media
  from: User
  to: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
}

export interface TransfersQueryResponse {
  transfers: Array<Transfer>
}

export interface URIUpdate {
  id: string
  type: string
  from: string
  to: string
  media: Media
  owner: User
  updater: User
  createdAtTimestamp: BigInt
  createdAtBlockNumber: BigInt
}

export interface URIUpdatesQueryResponse {
  uriupdates: Array<URIUpdate>
}
