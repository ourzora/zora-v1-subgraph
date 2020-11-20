import {Media, User} from "../types/schema";
import {Media as MediaContract, Transfer, Mint} from "../types/Media/Media";
import {Address, Bytes, BigInt} from "@graphprotocol/graph-ts";


const zeroAddress = "0x0000000000000000000000000000000000000000";

export function handleTransfer(event: Transfer): void {
    let toUser = findOrCreateUser(event.params.to.toHex());
    let fromUser = findOrCreateUser(event.params.from.toHex());

    if (fromUser.id == zeroAddress){
        handleMint(event);
        return;
    }

    let tokenId = event.params.tokenId.toString();
    let media = Media.load(tokenId);
    media.owner = toUser.id;
    media.prevOwner = fromUser.id;
    media.save();
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
