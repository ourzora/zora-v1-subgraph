# Example Subgraph

An example to help you get started with The Graph. For more information see the docs on https://thegraph.com/docs/.

## Local Setup

### 1. Clone Invert Repository

In a separate terminal:

```
git clone https://github.com/ourzora/invert.git
```

### 2. Run Local Blockchain

```
yarn && yarn chain
```

checkout breck/scripts branch

```
git fetch
git checkout breck/scripts
```

Deploy market and media contracts.

```
echo "{}" > addresses/50.json
```

```
yarn deploy --chainId 50
```

### 3. Setup the Graph-Node

In a separate terminal: 

Clone the graph-node repository.

```
git clone https://github.com/graphprotocol/graph-node.git
```

Edit the docker-compose.yaml to include your local ganache instance. 

```
cd docker
```

Copy / Paste this replacing the existing docker-compose.yaml 

THis is telling the graph node to connect to 

```yaml
version: '3'
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000'
      - '8001:8001'
      - '8020:8020'
      - '8030:8030'
      - '8040:8040'
    depends_on:
      - ipfs
      - postgres
    environment:
      postgres_host: postgres:5432
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'ganache:http://host.docker.internal:8545'
      RUST_LOG: info
  ipfs:
    image: ipfs/go-ipfs:v0.4.23
    ports:
      - '5001:5001'
    volumes:
      - ./data/ipfs:/data/ipfs
  postgres:
    image: postgres
    ports:
      - '5432:5432'
    command: ["postgres", "-cshared_preload_libraries=pg_stat_statements"]
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: let-me-in
      POSTGRES_DB: graph-node
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

### 4. Create and Deploy Subgraph

In a new terminal in this directory run:

```
yarn create-local
```

```
yarn deploy-local
```

### 5. Add some data to graphql

In order to have your subgraph begin indexing data, we need to interact with our contracts running on ganache.
In the invert directory there is a file `scripts/media.ts` that contains a cli for doing all of the different contract
interactions you may want.

You can run doing this: 

```
yarn ts-node scripts/media.ts --chainId 50 --funcName mint
```


## Run Tests

1. Run blockchain locally using invert mnuemonic

```
cd ${PATHTOINVERT}
```

```
yarn chain
```

2. Run Tests

```
yarn test
```

