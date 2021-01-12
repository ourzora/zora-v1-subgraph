# Zora V1 Subgraph

A subgraph implementation for the V1 of the Zora Protocol

## Local Setup

### 1. Run Local Blockchain

From the project directory.

```
yarn && yarn chain
```

### 2. Setup the Graph-Node

In a separate terminal clone the graph repository in the location of your choice.

```
git clone https://github.com/graphprotocol/graph-node.git
```

start up graph node using docker. 

```
cd graph-node
cd docker 
docker-compose up
```

If for any reason you need to tear down the graph node. Make sure to also delete the data directory

```
docker-compose down
rm -rf ./data
```

### 3. Deploy Contracts to Local Blockchain

Configure `.env.local`. Copy the fields from the `.env.example`.

Hint: 
- Copy / Paste `http://0.0.0.0:8545` as RPC_ENDPOINT
- Copy / Paste the first Private Key from `@zoralabs/core/dist/utils/generatedWallets` as PK.
- Set `PATH_TO_GRAPH` as the path to the dir of the `graph-node` repository you just cloned.
- Set `FLEEK_API_KEY` to a key ethan gives you
- Set `FLEEK_API_SECRET` to a secret ethan gives you

```
yarn deploy-contracts --chainId 50
```

### 4. Build and Deploy Subgraph to Local Graph Node

```
yarn codegen
yarn build
yarn prepare:local 
yarn create-local
yarn deploy-local
```

### 5. Seed Contract with Newly Minted Media

```
yarn seed-graph --chainId 50 --fullMonty
```

### 6. Voila

Open `http://127.0.0.1:8000/` in your browser to get a GraphiQL interface to submit
queries to the subgraph.

You can execute contract functions using the various scripts n `scripts`.

Run them by executing `yarn ts-node scripts/<script name> --chainId <chainID> <args>`


## Running Tests

In a separate terminal start up a blockchain.

```
yarn chain
```

To run tests 

```
yarn prepare:local
yarn codegen
yarn build
yarn test
```

They may take up to 30 minutes to run.

## Advanced Setup

There are many scripts that can be run to customize the data populated in your contracts / subgraph.

In `seed.ts` you have the following options to run for all of the generatedWallets
- `--fullyMonty` will deploy a new currency contract, mint currency, approve currency, mintMedia, setRandomAsks, and setRandomBids
- `--asks` will set random asks on all the media minted by the generatedWallets
- `--bids` will set random bids on 1 piece of media for each wallet in generatedWallets
- `--transfers` will randomly transfer 1 piece of media from each wallet to a randomly selected wallet in generatedWallets
- (SOON) `--betterMint` will mint a piece of media of each mime type for each wallet. 

In `media.ts` you can interact directly with the contracts by passing `--funcName` and the name of the function.
You can also mint any media that currently already lives on ipfs by passing in `--funcName mintFromIPFS --mimeType <mimeType`

Example: 

```bash

yarn ts-node scripts/media --chainId 4 --funcName mintFromIPFS --ipfsPath Qmba649sCjuvUk6cY8ca9roFWHdXA7Cp2Ka66SmBdhJy9Y/snowbringerpix.gif --mimeType image/gif

```