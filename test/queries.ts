import {gql} from "graphql-request";

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
    `;
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
                currency
                sellOnShare
                owner {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
            }
        }
    
    `;
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
                currency
                sellOnShare
                owner {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
            }
        }
    `;
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
                currency
                sellOnShare
                recipient {
                  id
                }
                bidder {
                  id
                }
                createdAtTimestamp
                createdAtBlockNumber
            }
        }
    `;
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
                currency
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
    `;
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
                currency
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
    `;
}