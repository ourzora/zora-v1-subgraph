import { gql } from 'graphql-request'

export function mediaByIdQuery(id: string): string {
  return gql`
    {
        media(id: "${id}") {
            id
            metadataURI
            contentURI
            contentHash
            metadataHash
            owner {
              id
            }
            creator {
              id
            }
            prevOwner {
              id
            }
            approved {
              id
            }
            currentBids {
              id
            }
            currentAsk {
              id
            }
            inactiveBids {
              id
            }
            inactiveAsks {
              id
            }
        }
    }
    `
}

export function userByIdQuery(id: string): string {
  return gql`
        {
            user(id: "${id}") {
              id
              creations {
                id
              }
              collection{
                id
              }
              authorizedUsers {
                id
              }
            }
        }
    `
}

export function askByIdQuery(id: string): string {
  return gql`
        {
            ask(id: "${id}") {
                id
                media {
                  id
                }
                amount
                currency {
                  id
                }
                owner {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
            }
        }
    
    `
}

export function inactiveAsksByMediaIdQuery(mediaId: string): string {
  return gql`
        {
            inactiveAsks(where: { media: "${mediaId}"}) {
                id
                type
                media {
                  id
                }
                amount
                currency {
                  id
                }
                owner {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
                inactivatedAtTimestamp
                inactivatedAtBlockNumber
            }
        }
    `
}

export function inactiveBidsByMediaIdQuery(mediaId: string): string {
  return gql`
        {
            inactiveBids(where: { media: "${mediaId}"}) {
                id
                type
                media {
                  id
                }
                amount
                currency {
                  id
                }
                sellOnShare
                recipient {
                  id
                }
                bidder {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
                inactivatedAtTimestamp
                inactivatedAtBlockNumber
            }
        }
    `
}

export function bidByIdQuery(id: string): string {
  return gql`
        {
            bid(id: "${id}") {
                id
                media {
                  id
                }
                amount
                currency {
                  id
                }
                sellOnShare
                bidder {
                  id
                }
                recipient {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
            }
        }
    `
}

export function inactiveBidByIdQuery(id: string): string {
  return gql`
        {
            inactiveBid(id: "${id}") {
                id
                type
                media {
                  id
                }
                amount
                currency {
                  id
                }
                sellOnShare
                bidder {
                  id
                }
                recipient {
                  id 
                }
                createdAtTimestamp
                createdAtBlockNumber
                inactivatedAtTimestamp
                inactivatedAtBlockNumber
            }
        }
    `
}

export function currencyByIdQuery(id: string): string {
  return gql`
        {
            currency(id: "${id}") {
                id
                name
                symbol
                decimals
                liquidity
            }    
        }
    `
}

export function transfersByMediaIdQuery(mediaId: string): string {
  return gql`
        {
            transfers(where: { media: "${mediaId}"}){
                id
                media {
                  id
                }
                from {
                  id
                }
                to {
                  id
                }
            }
        }
    `
}

export function transfersByFromIdQuery(fromId: string): string {
  return gql`
        {
            transfers(where: { from: "${fromId}"}){
                id
                media {
                  id
                }
                from {
                  id
                }
                to {
                  id
                }
            }
        }
    `
}

export function transfersByToIdQuery(toId: string): string {
  return gql`
        {
            transfers(where: { to: "${toId}"}){
                id
                media {
                  id
                }
                from {
                  id
                }
                to {
                  id
                }
            }
        }
    `
}

export function uriUpdatesByMediaIdQuery(mediaId: string): string {
  return gql`
        {
            uriupdates(where: { media: "${mediaId}"}){
                id 
                type
                media {
                    id
                }
                from
                to
                owner {
                    id
                }
                updater {
                    id
                }
            }
        }
    `
}

export function uriUpdatesByUpdaterIdQuery(updaterId: string): string {
  return gql`
        {
            uriupdates(where: { updater: "${updaterId}" }){
                id 
                type
                media {
                    id
                }
                from
                to
                owner {
                    id
                }
                updater {
                    id
                }
            }
        }
    `
}

export function bidsForMedia(mediaId: string): string {
  return gql`
        {
          bids(where: {media: "${mediaId}"}){
            id
            currency {
              id
            }
            amount
            sellOnShare
            bidder {
              id
            }
            
           recipient {
             id
           }
          }
        }
    `
}

export function bidsForBidder(bidderId: string): string {
  return gql`
        {
          bids(where: {bidder: "${bidderId}"}){
            id
            currency {
              id
            }
            media {
              id
            }
            amount
            sellOnShare
            bidder {
              id
            }
            
           recipient {
             id
           }
          }
        }
    `
}
