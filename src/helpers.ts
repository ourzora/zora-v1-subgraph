import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts/index'
import {
  Ask,
  Bid,
  Currency,
  InactiveAsk,
  InactiveBid,
  Media,
  Transfer,
  URIUpdate,
  User,
} from '../types/schema'
import { Media as MediaContract } from '../types/Media/Media'
import { Market as MarketContract } from '../types/Market/Market'
import { ERC20 } from '../types/Market/ERC20'
import { ERC20NameBytes } from '../types/Market/ERC20NameBytes'
import { ERC20SymbolBytes } from '../types/Market/ERC20SymbolBytes'

export const zeroAddress = '0x0000000000000000000000000000000000000000'

/**
 *  helper class to model BidShares
 */
export class BidShares {
  creator: BigInt
  owner: BigInt
  prevOwner: BigInt

  constructor(creator: BigInt, owner: BigInt, prevOwner: BigInt) {
    this.creator = creator
    this.owner = owner
    this.prevOwner = prevOwner
  }
}

/**
 * Find or Create a User entity with `id` and return it
 * @param id
 */
export function findOrCreateUser(id: string): User {
  let user = User.load(id)

  if (user == null) {
    user = new User(id)
    user.save()
  }

  return user as User
}

/**
 * Find or Create a Currency entity with `id` and return it
 * @param id
 */
export function findOrCreateCurrency(id: string): Currency {
  let currency = Currency.load(id)

  if (currency == null) {
    currency = createCurrency(id)
  }

  return currency as Currency
}

/**
 * Create a Currency Entity in storage.
 * Populate fields by fetching data from the blockchain.
 * @param id
 */
export function createCurrency(id: string): Currency {
  let currency = new Currency(id)
  currency.liquidity = BigInt.fromI32(0)

  let name = fetchCurrencyName(Address.fromString(id))
  let symbol = fetchCurrencySymbol(Address.fromString(id))
  let decimals = fetchCurrencyDecimals(Address.fromString(id))

  currency.name = name
  currency.symbol = symbol
  currency.decimals = decimals

  currency.save()
  return currency
}

/**
 * Fetch the BidShares for a piece of Media by Reading the Zora Market Contract
 * @param tokenId
 * @param mediaAddress
 */
export function fetchMediaBidShares(tokenId: BigInt, mediaAddress: Address): BidShares {
  let media = MediaContract.bind(mediaAddress)
  let marketAddress = media.marketContract()
  let market = MarketContract.bind(marketAddress)
  let bidSharesTry = market.try_bidSharesForToken(tokenId)
  if (bidSharesTry.reverted) {
    return new BidShares(null, null, null)
  }

  return new BidShares(
    bidSharesTry.value.creator.value,
    bidSharesTry.value.owner.value,
    bidSharesTry.value.prevOwner.value
  )
}

/**
 * Fetch the `decimals` from the specified ERC20 contract on the blockchain
 * @param currencyAddress
 */
export function fetchCurrencyDecimals(currencyAddress: Address): i32 {
  let contract = ERC20.bind(currencyAddress)
  // try types uint8 for decimals
  let decimalValue = null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue as i32
}

/**
 * Fetch the `symbol` from the specified ERC20 contract on the Blockchain
 * @param currencyAddress
 */
export function fetchCurrencySymbol(currencyAddress: Address): string {
  let contract = ERC20.bind(currencyAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(currencyAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

/**
 * Fetch the `name` of the specified ERC20 contract on the blockchain
 * @param currencyAddress
 */
export function fetchCurrencyName(currencyAddress: Address): string {
  let contract = ERC20.bind(currencyAddress)
  let contractNameBytes = ERC20NameBytes.bind(currencyAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

/**
 * Create New Media Entity
 * @param id
 * @param owner
 * @param creator
 * @param prevOwner
 * @param contentURI
 * @param contentHash
 * @param metadataURI
 * @param metadataHash
 * @param creatorBidShare
 * @param ownerBidShare
 * @param prevOwnerBidShare
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createMedia(
  id: string,
  owner: User,
  creator: User,
  prevOwner: User,
  contentURI: string,
  contentHash: Bytes,
  metadataURI: string,
  metadataHash: Bytes,
  creatorBidShare: BigInt,
  ownerBidShare: BigInt,
  prevOwnerBidShare: BigInt,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt
): Media {
  let media = new Media(id)
  media.owner = owner.id
  media.creator = creator.id
  media.prevOwner = prevOwner.id
  media.contentURI = contentURI
  media.contentHash = contentHash
  media.metadataURI = metadataURI
  media.metadataHash = metadataHash
  media.creatorBidShare = creatorBidShare
  media.ownerBidShare = ownerBidShare
  media.prevOwnerBidShare = prevOwnerBidShare
  media.createdAtTimestamp = createdAtTimestamp
  media.createdAtBlockNumber = createdAtBlockNumber

  media.save()
  return media
}

/**
 * Create New Ask Entity
 * @param id
 * @param amount
 * @param currency
 * @param media
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createAsk(
  id: string,
  amount: BigInt,
  currency: Currency,
  media: Media,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt
): Ask {
  let ask = new Ask(id)
  ask.amount = amount
  ask.currency = currency.id
  ask.media = media.id
  ask.owner = media.owner
  ask.createdAtTimestamp = createdAtTimestamp
  ask.createdAtBlockNumber = createdAtBlockNumber

  ask.save()
  return ask
}

/**
 * Create New InactiveAsk Entity
 * @param id
 * @param media
 * @param type
 * @param amount
 * @param currency
 * @param owner
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createInactiveAsk(
  id: string,
  media: Media,
  type: string,
  amount: BigInt,
  currency: Currency,
  owner: string,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt,
  inactivatedAtTimestamp: BigInt,
  inactivatedAtBlockNumber: BigInt
): InactiveAsk {
  let inactiveAsk = new InactiveAsk(id)

  inactiveAsk.type = type
  inactiveAsk.media = media.id
  inactiveAsk.amount = amount
  inactiveAsk.currency = currency.id
  inactiveAsk.owner = owner
  inactiveAsk.createdAtTimestamp = createdAtTimestamp
  inactiveAsk.createdAtBlockNumber = createdAtBlockNumber
  inactiveAsk.inactivatedAtTimestamp = inactivatedAtTimestamp
  inactiveAsk.inactivatedAtBlockNumber = inactivatedAtBlockNumber

  inactiveAsk.save()
  return inactiveAsk
}

/**
 * Create New InactiveBid Entity
 * @param id
 * @param type
 * @param media
 * @param amount
 * @param currency
 * @param sellOnShare
 * @param bidder
 * @param recipient
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createInactiveBid(
  id: string,
  type: string,
  media: Media,
  amount: BigInt,
  currency: Currency,
  sellOnShare: BigInt,
  bidder: User,
  recipient: User,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt,
  inactivatedAtTimestamp: BigInt,
  inactivatedAtBlockNumber: BigInt
): InactiveBid {
  let inactiveBid = new InactiveBid(id)
  inactiveBid.type = type
  ;(inactiveBid.media = media.id), (inactiveBid.amount = amount)
  inactiveBid.currency = currency.id
  inactiveBid.sellOnShare = sellOnShare
  inactiveBid.bidder = bidder.id
  inactiveBid.recipient = recipient.id
  inactiveBid.createdAtTimestamp = createdAtTimestamp
  inactiveBid.createdAtBlockNumber = createdAtBlockNumber
  inactiveBid.inactivatedAtTimestamp = inactivatedAtTimestamp
  inactiveBid.inactivatedAtBlockNumber = inactivatedAtBlockNumber

  inactiveBid.save()
  return inactiveBid
}

/**
 * Create New Bid Entity
 * @param id
 * @param amount
 * @param currency
 * @param sellOnShare
 * @param bidder
 * @param recipient
 * @param media
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createBid(
  id: string,
  amount: BigInt,
  currency: Currency,
  sellOnShare: BigInt,
  bidder: User,
  recipient: User,
  media: Media,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt
): Bid {
  let bid = new Bid(id)
  bid.amount = amount
  bid.currency = currency.id
  bid.sellOnShare = sellOnShare
  bid.bidder = bidder.id
  bid.recipient = recipient.id
  bid.media = media.id
  bid.createdAtTimestamp = createdAtTimestamp
  bid.createdAtBlockNumber = createdAtBlockNumber

  bid.save()
  return bid
}

/**
 * Create New Transfer Entity
 * @param id
 * @param media
 * @param from
 * @param to
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createTransfer(
  id: string,
  media: Media,
  from: User,
  to: User,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt
): Transfer {
  let transfer = new Transfer(id)
  transfer.media = media.id
  transfer.from = from.id
  transfer.to = to.id
  transfer.createdAtTimestamp = createdAtTimestamp
  transfer.createdAtBlockNumber = createdAtBlockNumber

  transfer.save()
  return transfer
}

/**
 * Create New URIUpdate Entity
 * @param id
 * @param media
 * @param type
 * @param from
 * @param to
 * @param updater
 * @param owner
 * @param createdAtTimestamp
 * @param createdAtBlockNumber
 */
export function createURIUpdate(
  id: string,
  media: Media,
  type: string,
  from: string,
  to: string,
  updater: string,
  owner: string,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt
): URIUpdate {
  let uriUpdate = new URIUpdate(id)
  uriUpdate.media = media.id
  uriUpdate.type = type
  uriUpdate.from = from
  uriUpdate.to = to
  uriUpdate.updater = updater
  uriUpdate.owner = owner
  uriUpdate.createdAtTimestamp = createdAtTimestamp
  uriUpdate.createdAtBlockNumber = createdAtBlockNumber

  uriUpdate.save()
  return uriUpdate
}

function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}
