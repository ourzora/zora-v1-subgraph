import {Media, User} from "../types/schema";
import {Media as MediaContract, Approval, ApprovalForAll, Transfer, TokenURIUpdated, TokenMetadataURIUpdated} from "../types/Media/Media";
import {Address, Bytes, BigInt, log} from "@graphprotocol/graph-ts";
import {findOrCreateUser, createMedia, fetchMediaBidShares, BidShares, zeroAddress} from './helpers';

export function handleTokenURIUpdated(event: TokenURIUpdated): void {
    let tokenId = event.params._tokenId.toString()

    log.info(`Starting handler for TokenURIUpdated Event for tokenId: {}`, [tokenId]);

    let media = Media.load(tokenId);
    if (media == null){
        log.error("Media is null for tokenId: {}", [tokenId]);
    }

    media.contentURI = event.params._uri;
    media.save();

    log.info(`Completed handler for TokenURIUpdated Event for tokenId: {}`, [tokenId]);
}

export function handleTokenMetadataURIUpdated(event: TokenMetadataURIUpdated): void {
    let tokenId = event.params._tokenId.toString()

    log.info(`Starting handler for TokenMetadataURIUpdated Event for tokenId: {}`, [tokenId]);

    let media = Media.load(tokenId);
    if (media == null){
        log.error("Media is null for tokenId: {}", [tokenId]);
    }

    media.metadataURI = event.params._uri;
    media.save();

    log.info(`Completed handler for TokenMetadataURIUpdated Event for tokenId: {}`, [tokenId]);
}

export function handleTransfer(event: Transfer): void {
    let fromAddr = event.params.from.toHexString();
    let toAddr = event.params.to.toHexString();
    let tokenId = event.params.tokenId.toString();

    log.info(`Starting handler for Transfer Event of tokenId: {}, from: {}. to: {}`, [tokenId, fromAddr, toAddr])

    let toUser = findOrCreateUser(toAddr);
    let fromUser = findOrCreateUser(fromAddr);

    if (fromUser.id == zeroAddress){
        handleMint(event);
        return;
    }

    let media = Media.load(tokenId);

    if(toUser.id == zeroAddress){
        media.prevOwner = zeroAddress;
        media.burnedAtTimeStamp = event.block.timestamp;
        media.burnedAtBlockNumber = event.block.number;
    } else {
        media.prevOwner = fromUser.id;
    }

    media.owner = toUser.id;
    media.approved = null;
    media.save();

    log.info(`Completed handler for Transfer Event of tokenId: {}, from: {}. to: {}`, [tokenId, fromAddr, toAddr])
}

export function handleApproval(event: Approval): void {
    let ownerAddr = event.params.owner.toHexString();
    let approvedAddr = event.params.approved.toHexString();
    let tokenId = event.params.tokenId.toString();

    log.info(`Starting handler for Approval Event of tokenId: {}, owner: {}, approved: {}`, [tokenId, ownerAddr, approvedAddr])

    let media = Media.load(tokenId);
    if (media == null) {
        log.error("Media is null for tokenId: {}", [tokenId]);
    }

    if (approvedAddr == zeroAddress) {
        media.approved = null;
    } else {
        let approvedUser = findOrCreateUser(approvedAddr);
        media.approved = approvedUser.id;
    }

    media.save();

    log.info(`Completed handler for Approval Event of tokenId: {}, owner: {}, approved: {}`, [tokenId, ownerAddr, approvedAddr])
}

export function handleApprovalForAll(event: ApprovalForAll): void {
    let ownerAddr = event.params.owner.toHexString();
    let operatorAddr = event.params.operator.toHexString();
    let approved = event.params.approved;


    log.info(`Starting handler for ApprovalForAll Event for owner: {}, operator: {}, approved: {}`, [ownerAddr, operatorAddr, approved.toString()])

    let owner = findOrCreateUser(ownerAddr);
    let operator = findOrCreateUser(operatorAddr);

    if (approved == true) {
        owner.authorizedUsers = owner.authorizedUsers.concat([operator.id]);
    } else {
        let index = owner.authorizedUsers.indexOf(operator.id);
        let copyAuthorizedUsers = owner.authorizedUsers;
        copyAuthorizedUsers.splice(index, 1);
        owner.authorizedUsers = copyAuthorizedUsers;
    }

    owner.save();

    log.info(`Completed handler for ApprovalForAll Event for owner: {}, operator: {}, approved: {}`, [ownerAddr, operatorAddr, approved.toString()])
}

function handleMint(event: Transfer): void {
    let creator = findOrCreateUser(event.params.to.toHexString());
    let tokenId = event.params.tokenId;

    let mediaContract = MediaContract.bind(event.address);
    let contentURI = mediaContract.tokenURI(tokenId);
    let metadataURI = mediaContract.tokenMetadataURI(tokenId);

    let contentHash = mediaContract.tokenContentHashes(tokenId);
    let metadataHash = mediaContract.tokenMetadataHashes(tokenId);

    let bidShares = fetchMediaBidShares(tokenId);

    createMedia(
        tokenId.toString(),
        creator,
        creator,
        creator,
        contentURI,
        contentHash,
        metadataURI,
        metadataHash,
        bidShares.creator,
        bidShares.owner,
        bidShares.prevOwner,
        event.block.timestamp,
        event.block.number
    )
}
