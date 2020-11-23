import {Address, Bytes, BigDecimal, BigInt} from "@graphprotocol/graph-ts/index";
import {User, Media} from '../types/schema';
import {Market as MarketContract} from '../types/Market/Market';

const mediaAddrss = "0x1D7022f5B17d2F8B695918FB48fa1089C9f85401";
const marketAddress = "0x1dC4c1cEFEF38a777b15aA20260a54E584b16C48";

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

export function fetchMediaBidShares(tokenId: BigInt): BidShares {
    let market = MarketContract.bind(Address.fromString(marketAddress));
    let bidShares = market.bidSharesForToken(tokenId);

    return new BidShares(bidShares.creator.value, bidShares.owner.value, bidShares.prevOwner.value);
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
    prevOwnerBidShare: BigInt
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

    media.save();
    return media;
}