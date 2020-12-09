import {Address, Bytes, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts/index";
import {
    User,
    Media,
    Ask,
    Bid,
    InactiveAsk,
    InactiveBid,
    Currency
} from '../types/schema';
import {Market as MarketContract} from '../types/Market/Market';

const mediaAddress = "0x1D7022f5B17d2F8B695918FB48fa1089C9f85401";
const marketAddress = "0x1dC4c1cEFEF38a777b15aA20260a54E584b16C48";
export const zeroAddress = "0x0000000000000000000000000000000000000000";

export class BidShares {
    creator: BigInt
    owner: BigInt
    prevOwner: BigInt

    constructor(creator: BigInt, owner: BigInt, prevOwner: BigInt) {
        this.creator = creator;
        this.owner = owner;
        this.prevOwner = prevOwner;
    }
}

export function findOrCreateUser(id: string): User {
    let user = User.load(id);

    if (user == null){
        user = new User(id);
        user.save();
    }

    return user as User;
}

export function findOrCreateCurrency(id: string): Currency {
    let currency = Currency.load(id);

    if (currency == null){
        currency = new Currency(id);
        currency.liquidity = BigInt.fromI32(0);
        currency.save();
    }

    return currency as Currency;
}

export function fetchMediaBidShares(tokenId: BigInt): BidShares {
    let market = MarketContract.bind(Address.fromString(marketAddress));
    let bidSharesTry = market.try_bidSharesForToken(tokenId);
    if (bidSharesTry.reverted){
        return new BidShares(null, null, null);
    }

    return new BidShares(bidSharesTry.value.creator.value, bidSharesTry.value.owner.value, bidSharesTry.value.prevOwner.value);
}

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
    let media = new Media(id);
    media.owner = owner.id;
    media.creator = creator.id;
    media.prevOwner = prevOwner.id;
    media.contentURI = contentURI;
    media.contentHash = contentHash;
    media.metadataURI = metadataURI;
    media.metadataHash = metadataHash;
    media.creatorBidShare = creatorBidShare;
    media.ownerBidShare = ownerBidShare;
    media.prevOwnerBidShare = prevOwnerBidShare;
    media.createdAtTimestamp = createdAtTimestamp;
    media.createdAtBlockNumber = createdAtBlockNumber;

    media.save();
    return media;
}

export function createAsk(
    id: string,
    amount: BigInt,
    currency: Currency,
    sellOnShare: BigInt,
    media: Media,
    createdAtTimestamp: BigInt,
    createdAtBlockNumber: BigInt
): Ask {
    let ask = new Ask(id);
    ask.amount = amount;
    ask.currency = currency.id;
    ask.sellOnShare = sellOnShare;
    ask.media = media.id;
    ask.owner = media.owner;
    ask.createdAtTimestamp = createdAtTimestamp;
    ask.createdAtBlockNumber = createdAtBlockNumber;

    ask.save();
    return ask;
}

export function createInactiveAsk(
    id: string,
    media: Media,
    type: string,
    amount: BigInt,
    currency: Currency,
    sellOnShare: BigInt,
    owner: string,
    createdAtTimestamp: BigInt,
    createdAtBlockNumber: BigInt
): InactiveAsk {
    let inactiveAsk = new InactiveAsk(id);
    
    inactiveAsk.type = type;
    inactiveAsk.media = media.id;
    inactiveAsk.amount = amount;
    inactiveAsk.currency = currency.id;
    inactiveAsk.sellOnShare = sellOnShare;
    inactiveAsk.owner = owner;
    inactiveAsk.createdAtTimestamp = createdAtTimestamp;
    inactiveAsk.createdAtBlockNumber = createdAtBlockNumber;
    
    inactiveAsk.save();
    return inactiveAsk;
}

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
    createdAtBlockNumber: BigInt
): InactiveBid {
    let inactiveBid = new InactiveBid(id);
    inactiveBid.type = type;
    inactiveBid.media = media.id,
    inactiveBid.amount = amount;
    inactiveBid.currency = currency.id;
    inactiveBid.sellOnShare = sellOnShare;
    inactiveBid.bidder = bidder.id;
    inactiveBid.recipient = recipient.id;
    inactiveBid.createdAtTimestamp = createdAtTimestamp;
    inactiveBid.createdAtBlockNumber = createdAtBlockNumber;

    inactiveBid.save();
    return inactiveBid;
}

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
    let bid = new Bid(id);
    bid.amount = amount;
    bid.currency = currency.id;
    bid.sellOnShare = sellOnShare;
    bid.bidder = bidder.id;
    bid.recipient = recipient.id;
    bid.media = media.id;
    bid.createdAtTimestamp = createdAtTimestamp;
    bid.createdAtBlockNumber = createdAtBlockNumber;

    bid.save();
    return bid;
}

