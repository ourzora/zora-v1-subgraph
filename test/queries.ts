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