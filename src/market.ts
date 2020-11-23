import {BidShareUpdated} from '../types/Market/Market';
import {BigDecimal, log} from "@graphprotocol/graph-ts";
import {Media, User} from "../types/schema";

export function handleBidShareUpdated(event: BidShareUpdated): void {
    let tokenId = event.params.tokenId.toString();
    let bidShares = event.params.bidShares;

    log.info(`Starting handler for BidShareUpdated Event for tokenId: {}, bidShares: {}`, [tokenId, bidShares.toString()]);

    let media = Media.load(tokenId);
    if (media == null) {
        log.error("Media is null for tokenId: {}", [tokenId]);
    }

    media.creatorBidShare = bidShares.creator.value;
    media.ownerBidShare = bidShares.owner.value;
    media.prevOwnerBidShare = bidShares.prevOwner.value;
    media.save();

    log.info(`Completed handler for BidShareUpdated Event for tokenId: {}, bidShares: {}`, [tokenId, bidShares.toString()]);
}

