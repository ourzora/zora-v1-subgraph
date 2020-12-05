# Example Subgraph

An example to help you get started with The Graph. For more information see the docs on https://thegraph.com/docs/.

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

### 3. Deploy Contracts to Local Blockchain

Configure `.env.local`. Copy the fields from the `.env.example`.

Hint: 
- Copy / Paste `http://0.0.0.0:8545` as RPC_ENDPOINT
- Copy / Paste the first Private Key from `@zoralabs/media/dist/utils/generatedWallets` as PK.
- Set `MEDIA_ADDRESS` After Deploying. It will exist in `addresses/50.json`;
- Set `PATH_TO_GRAPH` as the path to the dir of the `graph-node` repository you just cloned.

```
yarn deploy-contracts --chainId 50
```

### 4. Build and Deploy Subgraph to Local Graph Node

```
yarn
yarn build
yarn create-local
yarn deploy-local
```

### 5. Seed Contract with Newly Minted Media

```
yarn seed-graph --chainId
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
yarn test
```

They may take up to 30 minutes to run.