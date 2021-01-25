# Zora Subgraph Entities

This page describes all of the GraphQL entities of the Zora Subgraph.

## Media

The `Media` entity represents the core data for a piece of Zora `cryptomedia`.

| Field Name            |  Type     |     Description                                            |
| --------------------- | --------- | ---------------------------------------------------------- |
| id                    | ID        | The tokenId on the Zora Media Contract                     |
| owner                 | User      | The current owner of the Media                             |
| creator               | User      | The creator of the Media                                   |
| prevowner             | User      | The previous owner of the Zora Media's Market              |
| approved              | User      | The approved user of the Media                             |
| contentHash           | Bytes     | The sha256 hash of the media's content                     |
| metadataHash          | Bytes     | The sha256 hash of the media's metadata                    |
| contentURI            | String    | The uri of the content                                     |
| metadataURI           | String    | The uri of the metadata                                    |
| ownerBidShare         | BigInt    | The bid share for the current owner of the Media           |
| creatorBidShare       | BigInt    | The bid share for the creator of the Media                 |
| prevOwnerBidShare     | BigInt    | The bid share for the previous owner of the Media's market |
| createdAtTimestamp    | BigInt    | The timestamp of the block the Media was minted in         |
| createdAtBlockNumber  | BigInt    | The number of the block the Media was minted in            |
| burnedAtTimestamp     | BigInt    | The timestamp of the block the Media was burned in         |
| burnedAtBlockNumber   | BigInt    | The number of the block the Media was burned in            |
| currentAsk            | Ask       | The current Ask of the Media                               |
| currentBids           | \[Bid\]   | The current Bids on the Media                              |
| inactiveAsks          | \[Ask\]   | The InactiveAsks of the Media                              |
| inactiveBids          | \[Bid\]   | The InactiveBids of the Media                              |

## Users

The `User` entity represents ethereum accounts that interact with the Zora Protocol.

| Field Name            |  Type     |     Description                                                               |
| --------------------- | --------- | ----------------------------------------------------------------------------- |
| id                    | ID        | Ethereum Address                                                              |
| authorizedUsers       | \[User\]  | Users that have been granted `ApprovalForAll` Media of the User's Collection  |                             |
| collection            | \[Media\] | The Media the User owns                                                       |
| creations             | \[Media\] | The Media the User created                                                    |
| currentBids           | \[Bid\]   | The active Bids made by the User                                              |

## Ask

The `Ask` entity represents an onchain Ask for a piece of cryptomedia on the Zora Protocol.

| Field Name            |  Type     |     Description                                    |
| --------------------- | --------- | -------------------------------------------------- |
| id                    | ID        | \<tokenId\>-\<ownerAddress\>                       |
| media                 | Media     | The Media associated with the Ask                  |
| currency              | Currency  | The Currency of the Ask                            |
| amount                | BigInt    | The amount of Currency of the Ask                  |
| owner                 | User      | The owner of the Ask                               |
| createdAtTimestamp    | BigInt    | The timestamp of the block the Ask was created in  |
| createdAtBlockNumber  | BigInt    | The number of the block the Ask created in         |

## InactiveAsk

The `InactiveAsk` entity represents an Ask that is no longer valid on the Zora Protocol. InactiveAsks have either been `removed` or `finalized`.

| Field Name            |  Type           |     Description                                            |
| --------------------- | --------------- | ---------------------------------------------------------- |
| id                    | ID              | \<tokenId\>-\<ownerAddress\>                               |
| media                 | Media           | The Media associated with the InactiveAsk                  |
| type                  | MarketEventType | The why this Ask is Inactive                               |
| currency              | Currency        | The Currency of the InactiveAsk                            |
| amount                | BigInt          | The amount of Currency of the InactiveAsk                  |
| owner                 | User            | The owner of the InactiveAsk                               |
| createdAtTimestamp    | BigInt          | The timestamp of the block the InactiveAsk was created in  |
| createdAtBlockNumber  | BigInt          | The number of the block the InactiveAsk created in         |

## Bid

The `Bid` entity represents an onchain Bid for a piece of cryptomedia on the Zora Protocol.

| Field Name            |  Type           |     Description                                    |
| --------------------- | --------------- | -------------------------------------------------- |
| id                    | ID              | \<tokenId\>-\<bidderAddress\>                      |
| media                 | Media           | The Media associated with the Bid                  |
| currency              | Currency        | The Currency of the Bid                            |
| amount                | BigInt          | The amount of Currency of the Bid                  |
| sellOnShare           | BigInt          | he sellOnShare of the Bid                          |
| bidder                | User            | The bidder of the Bid                              |
| recipient             | User            | The recipient of the Bid                           |
| createdAtTimestamp    | BigInt          | The timestamp of the block the Bid was created in  |
| createdAtBlockNumber  | BigInt          | The number of the block the Bid created in         |

## InactiveBid

The `InactiveAsk` entity represents a Bid that is no longer valid on the Zora Protocol. InactiveBids have either been `removed` or `finalized`.


| Field Name            |  Type           |     Description                                            |
| --------------------- | --------------- | ---------------------------------------------------------- |
| id                    | ID              | \<tokenId\>-\<bidderAddress\>                              |
| media                 | Media           | The Media associated with the InactiveBid                  |
| type                  | MarketEventType | The why this Bid is Inactive                               |
| currency              | Currency        | The Currency of the InactiveBid                            |
| amount                | BigInt          | The amount of Currency of the InactiveBid                  |
| sellOnShare           | BigInt          | he sellOnShare of the InactiveBid                          |
| bidder                | User            | The bidder of the InactiveBid                              |
| recipient             | User            | The recipient of the InactiveBid                           |
| createdAtTimestamp    | BigInt          | The timestamp of the block the InactiveBid was created in  |
| createdAtBlockNumber  | BigInt          | The number of the block the InactiveBid created in         |

## Currency

The `Currency` entity represents ERC-20 tokens that have been used as Asks or Bids on the Zora Protocol.

| Field Name            |  Type   |     Description                                        |
| --------------------- | ------- | ------------------------------------------------------ |
| id                    | ID      | The address of the Currency                            |
| name                  | String  | The name of the Currency                               |
| symbol                | String  | The symbol of the Currency                             |
| decimals              | Int     | The decimals of the Currency                           |
| liquidity             | BigInt  | Total Bid Liquidity of the Currency on all Zora Media  |
| activeBids            | \[Bid\] | The active Bids denominated in the Currency            |
| activeAsks            | User    | The active Asks denominated in the Currency            |
| inactiveBids          | User    | The InactiveBids denominated in the Currency           |
| inactiveAsks          | BigInt  | The InactiveAsks denominated in the Currency           |

## Transfer

The `Transfer` entity represents transfers of ownership of pieces of cryptomedia on the Zora Protocol.


| Field Name            |  Type   |     Description                                        |
| --------------------- | ------- | ------------------------------------------------------ |
| id                    | ID      | \<tokenId\>-\<transactionHash\>-\<logIndex\>           |
| media                 | String  | The Media associated with the Transfer                 |
| from                  | String  | The User transferring the Media                        |
| to                    | Int     | The User receiving the Media                           |
| createdAtTimestamp    | BigInt  | The timestamp of the block the Transfer was created in |
| createdAtBlockNumber  | BigInt  | The number of the block the Transfer was created in    |


## URIUpdate

The `URIUpdate` entity represents updates to the `content` or `metadata` uris of cryptomedia on the Zora Protocol.

| Field Name            |  Type         |     Description                                         |
| --------------------- |-------------- | ------------------------------------------------------- |
| id                    | ID            | \<tokenId\>-\<transactionHash\>-\<logIndex\>            |
| type                  | URIUpdateType | The Type of URIUpdate                                   |
| from                  | String        | The previous uri                                        |
| to                    | Int           | The new uri                                             |
| media                 | String        | The Media associated with the URIUpdate                 |
| owner                 | User          | The owner of the Media                                  |
| updater               | User          | The updaterr of the Media's URI                         |
| createdAtTimestamp    | BigInt        | The timestamp of the block the URIUpdate was created in |
| createdAtBlockNumber  | BigInt        | The number of the block the URIUpdate was created in    |