import {BigInt} from "@graphprotocol/graph-ts/index";

export interface User {
    id: string;
    creations: Array<Media>;
    collection: Array<Media>;
    authorizedUsers: Array<User>;
    currentBids: Array<Bid>;
}

export interface UsersQueryResponse {
    users: Array<User>;
}

export interface UserQueryResponse {
    user: User;
}

export interface Media {
    id: string;
    contentHash: string;
    contentURI: string;
    metadataHash: string;
    metadataURI: string;
    creator: Media;
    owner: Media;
    prevOwner: Media;
    approved: User;
    currentAsk: Ask;
    currentBids: Array<Bid>;
    inactiveBids: Array<InactiveBid>;
    inactiveAsks: Array<InactiveAsk>;
    createdAtTimestamp: BigInt;
    createdAtBlockNumber: BigInt;
    burnedAtTimestamp: BigInt;
    burnedAtBlockNumber: BigInt;
}

export interface MediaQueryResponse{
    media: Media;
}

export interface MediasQueryResponse {
    medias: Array<Media>;
}

export interface Bid {
    id: string;
    media: Media;
    amount: BigInt;
    currency: string;
    sellOnShare: BigInt;
    bidder: User;
    recipient: User;
    createdAtTimestamp: BigInt;
    createdAtBlockNumber: BigInt;
}

export interface BidQueryResponse {
    bid: Bid;
}

export interface BidsQueryResponse {
    bids: Array<Bid>;
}

export interface Ask {
    id: string;
    media: Media;
    amount: BigInt;
    currency: string;
    sellOnShare: BigInt;
    owner: User;
    createdAtTimestamp: BigInt;
    createdAtBlockNumber: BigInt;
}

export interface AskQueryResponse {
    ask: Ask;
}

export interface AsksQueryResponse {
    asks: Array<Ask>;
}

export interface InactiveAsk {
    id: string;
    type: string;
    media: Media;
    amount: BigInt;
    currency: string;
    sellOnShare: BigInt;
    owner: User;
    createdAtTimestamp: BigInt;
    createdAtBlockNumber: BigInt;
}

export interface InactiveAskQueryResponse {
    inactiveAsk: InactiveAsk;
}

export interface InactiveAsksQueryResponse {
    inactiveAsks: Array<InactiveAsk>;
}

export interface InactiveBid {
    id: string;
    type: string;
    media: Media;
    amount: BigInt;
    currency: string;
    sellOnShare: BigInt;
    bidder: User;
    recipient: User;
    createdAtTimestamp: BigInt;
    createdAtBlockNumber: BigInt;
}

export interface InactiveBidQueryResponse {
    inactiveBid: InactiveBid;
}

export interface InactiveBidsQueryResponse {
    inactiveBids: Array<InactiveBid>;
}