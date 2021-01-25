# Querying for the Zora Subgraph

To quickly query the Zora Subgraph you can navigate to The Graph's online [sandbox](https://thegraph.com/explorer/subgraph/ourzora/zora-v1) and execute arbitrary graphql queries.

To programmatically query the Zora Subgraph you can send queries to `https://api.thegraph.com/subgraphs/name/ourzora/zora-v1`

## Example Queries

#### Media

`Media by Id`
```gql
{
  media(id: "") {
    id
    metadataURI
    contentURI
    contentHash
    metadataHash
    owner {
      id
    }
    ownerBidShare
    creator {
      id
    }
    creatorBidShare
    prevOwner {
      id
    }
    prevOwnerBidShare
    approved {
      id
    }
    currentBids {
      id
    }
    currentAsk {
      id
    }
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

`Media by Creator`
```gql
{
  media(where: { creator: "" }) {
    id
    metadataURI
    contentURI
    contentHash
    metadataHash
    owner {
      id
    }
    ownerBidShare
    creator {
      id
    }
    creatorBidShare
    prevOwner {
      id
    }
    prevOwnerBidShare
    approved {
      id
    }
    currentBids {
      id
    }
    currentAsk {
      id
    }
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

`Media by Owner`

```gql
{
  media(where: { owner: "" }) {
    id
    metadataURI
    contentURI
    contentHash
    metadataHash
    owner {
      id
    }
    ownerBidShare
    creator {
      id
    }
    creatorBidShare
    prevOwner {
      id
    }
    prevOwnerBidShare
    approved {
      id
    }
    currentBids {
      id
    }
    currentAsk {
      id
    }
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

`Medias by Previous Owner`

```gql
{
  media(where: { prevOwner: "" }) {
    id
    metadataURI
    contentURI
    contentHash
    metadataHash
    owner {
      id
    }
    ownerBidShare
    creator {
      id
    }
    creatorBidShare
    prevOwner {
      id
    }
    prevOwnerBidShare
    approved {
      id
    }
    currentBids {
      id
    }
    currentAsk {
      id
    }
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

#### Bids

`Bid by Id`

```gql
{
  bid(id: "") {
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
```

`Bids by Media`

```gql
{
  bids(where: { media: "" }){
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
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

`Bids by Currency`

```gql
{
  bids(where: { currency: "" }){
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
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

`Bids by Bidder`

```gql
{
  bids(where: { bidder: "" }){
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
    createdAtTimestamp
    createdAtBlockNumber
  }
}
```

#### Asks

`Ask by Id`
```gql
{
  ask(id: "") {
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
```

`Ask by Asker`
```gql
{
  asks(where: { owner: "" }) {
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
```

`Ask by Currency`
```gql
{
  asks(where: { currency: "" }) {
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
```

#### InactiveBids

`InactiveBid by Id`
```gql
{
  inactiveBid(id: "") {
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
  }
}
```

`InactiveBids by Media`
```gql
{
  inactiveBids(where: { media: "" }) {
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
  }
}
```

`InactiveBids by Bidder`
```gql
{
  inactiveBids(where: { bidder: "" }) {
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
  }
}
```

#### InactiveAsks

`InactiveAsk by Id`
```gql
{
  inactiveAsk(id: "") {
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
  }
}
```

`InactiveAsks by Media`
```gql
{
  inactiveAsks(where: { media: "" }) {
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
  }
}
```

`InactiveAsks by Asker`
```gql
{
  inactiveAsks(where: { owner: "" }) {
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
  }
}
```

#### UriUpdates

`UriUpdate by Id`
```gql
{
  uriupdate(id: "" ){
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
```

`UriUpdates by Updater`
```gql
{
  uriupdates(where: { updater: "" }){
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
```

`UriUpdates by Media`
```gql
{
  uriupdates(where: { media: "" }){
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
```

#### Transfers

`Transfer by Id`
```gql
{
  transfer(id: ""){
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
```

`Transfers by Media`
```gql
{
  transfers(where: { media: "" }){
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
```

`Transfers by From User`
```gql
{
  transfers(where: { from: "" }){
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
```

`Transfers by To User`
```gql
{
  transfers(where: { to: "" }){
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
```

#### Currency

`Currency by Id`
```gql
{
  currency(id: "") {
    id
    name
    symbol
    decimals
    liquidity
  }
}
```

#### User

`User by Id`
```gql
{
  user(id: "") {
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
```