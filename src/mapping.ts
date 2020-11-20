import {Media, User} from "../types/schema";
import {Media as MediaContract, Transfer, Mint} from "../types/Media/Media";
import {Address, Bytes} from "@graphprotocol/graph-ts";

const zeroAddress = "0x0000000000000000000000000000000000000000";

export function handleMint(event: Mint): void {
    let owner = findOrCreateUser(event.params.owner.toHex());
    let creator = findOrCreateUser(event.params.creator.toHex());
    let prevOwner = findOrCreateUser(zeroAddress);
    let tokenId = event.params.tokenId;

    let mediaContract = MediaContract.bind(event.address);
    let contentURI = mediaContract.tokenURI(tokenId);
    let metadataURI = mediaContract.tokenMetadataURI(tokenId);

    createMedia(
        tokenId.toString(),
        owner,
        creator,
        prevOwner,
        contentURI,
        event.params.contentHash,
        metadataURI,
        event.params.metadataHash
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
