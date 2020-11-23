import {Media, User} from "../types/schema";
import {Media as MediaContract, Approval, ApprovalForAll, Transfer, TokenURIUpdated, TokenMetadataURIUpdated} from "../types/Media/Media";
import {Address, Bytes, BigInt, log} from "@graphprotocol/graph-ts";


const zeroAddress = "0x0000000000000000000000000000000000000000";

export function handleTokenURIUpdated(event: TokenURIUpdated): void {
    let tokenId = event.params._tokenId.toString()

    log.info(`Starting handler for TokenURIUpdated Event for tokenId: {}`, [tokenId]);

    let media = Media.load(tokenId);
    if (media == null){
        log.error("Media is null", []);
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
        log.error("Media is null", []);
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
    media.owner = toUser.id;
    media.prevOwner = fromUser.id;
    media.approved = null;
    media.save();

    log.info(`Completed for Transfer Event of tokenId: {}, from: {}. to: {}`, [tokenId, fromAddr, toAddr])
}

export function handleApproval(event: Approval): void {
    let ownerAddr = event.params.owner.toHexString();
    let approvedAddr = event.params.approved.toHexString();
    let tokenId = event.params.tokenId.toString();

    log.info(`Starting handler for Approval Event of tokenId: {}, owner: {}, approved: {}`, [tokenId, ownerAddr, approvedAddr])

    let media = Media.load(tokenId);
    if (media == null) {
        log.error("Media is null", [tokenId]);
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
        log.info("Pushed operator to authorized users for owner. AuthorizedUsers: {}", [owner.authorizedUsers.toString()]);
    } else {
        let index = owner.authorizedUsers.indexOf(operator.id);
        let copyAuthorizedUsers = owner.authorizedUsers;
        copyAuthorizedUsers.splice(index, 1);
        owner.authorizedUsers = copyAuthorizedUsers;

        log.info("Removed authorized user. {} ", [owner.authorizedUsers.toString()]);
    }

    owner.save();

    log.info(`Completed handler for ApprovalForAll Event for owner: {}, operator: {}, approved: {}`, [ownerAddr, operatorAddr, approved.toString()])
}

function handleMint(event: Transfer): void {
    let creator = findOrCreateUser(event.params.to.toHex());
    let tokenId = event.params.tokenId;

    let mediaContract = MediaContract.bind(event.address);
    let contentURI = mediaContract.tokenURI(tokenId);
    let metadataURI = mediaContract.tokenMetadataURI(tokenId);

    let contentHash = mediaContract.tokenContentHashes(tokenId);
    let metadataHash = mediaContract.tokenMetadataHashes(tokenId);

    createMedia(
        tokenId.toString(),
        creator,
        creator,
        creator,
        contentURI,
        contentHash,
        metadataURI,
        metadataHash
    )
}

function findOrCreateUser(id: string): User {
    let user = User.load(id);

    if (user == null){
        user = new User(id);
        user.save();
    }

    return user as User;
}

function createMedia(id: string, owner: User, creator: User, prevOwner: User, contentURI: string, contentHash: Bytes, metadataURI: string, metadataHash: Bytes): Media {
    let media = new Media(id);
    media.owner = owner.id;
    media.creator = creator.id;
    media.prevOwner = prevOwner.id;
    media.contentURI = contentURI;
    media.contentHash = contentHash;
    media.metadataURI = metadataURI;
    media.metadataHash = metadataHash;
    media.save();
    return media;
}
