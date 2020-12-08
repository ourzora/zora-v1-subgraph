import { JsonRpcProvider } from '@ethersproject/providers';
import { generatedWallets } from '@zoralabs/media/dist/utils/generatedWallets';
import { approveCurrency, deployCurrency, mintCurrency } from '../utils/currency';
import { BigNumber } from 'ethers';
import { promises as fs } from "fs";
import sha256 from 'crypto-js/sha256';
import crypto from 'crypto';
import axios from 'axios';
import IPFS from 'ipfs-core';
import { mint } from '../utils/media';

async function startSeed(){

  // read from chainId.json
  const args = require('minimist')(process.argv.slice(2));

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required');
  }
  const path = `${process.cwd()}/.env${
    args.chainId === 1 ? '.prod' : args.chainId === 4 ? '.dev' : '.local'
  }`;
  await require('dotenv').config({ path });

  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT);

  let [
    wallet1,
    wallet2
  ] = generatedWallets(provider);

  const ipfs = await IPFS.create();

  const sharedAddressPath = `${process.cwd()}/config/${args.chainId}.json`;
  // @ts-ignore
  const config = JSON.parse(await fs.readFile(sharedAddressPath));

  if (config.mediaAddress == null) {
    throw new Error("media address not specified in addressbook");
  }

  if (config.marketAddress == null) {
    throw new Error("market address not specified in addressbook");
  }

  let mediaAddress = config.mediaAddress;
  let marketAddress = config.marketAddress;

  // deploy USDC
  let usdcAddress = await deployCurrency(wallet1);

  // mint 100,000 USDC for each wallet
  console.log("Currency Address: ", usdcAddress);

  console.log("Minting Currency for Each Generated Wallet");
  for (const wallet of generatedWallets(provider)) {
    await mintCurrency(wallet1, usdcAddress, wallet.address, BigNumber.from("100000000000000000000000"));
  }

  // for each address approve the market max uint256
  console.log("Granting Approval to Market Contract for each Generated Wallet");
  for (const wallet of generatedWallets(provider)) {
    await approveCurrency(wallet, usdcAddress, marketAddress);
  }

  let picsumIds = new Set();

  for (const wallet of generatedWallets(provider)){
    for(let i=0;i<10;i++){
      let response = await axios.get("https://picsum.photos/200/300", { responseType: 'arraybuffer'});
      let picsumId = response.headers['picsum-id'];

      while(picsumIds.has(picsumId)){
        response = await axios.get("https://picsum.photos/200/300", { responseType: 'arraybuffer'});
        picsumId = response.headers['picsum-id'];
      }

      picsumIds.add(picsumId);
      let sha256 = crypto.createHash('sha256');
      sha256.update(response.data);
      let contentHash = sha256.digest()

      let file = {content: response.data};

      // upload the file to ipfs
      const contentCID = await ipfs.add(file, {pin: true});

      const metadata = {
        version: "0.0.1",
        name: "Lorem Ipsum",
        description: "Lorem Ipsum",
        creator: wallet.address,
        mimeType: "image/jpeg",
      }

      const metadataJson = JSON.stringify(metadata);

      // hash the metadata
      let metadataSha256 = crypto.createHash('sha256');
      metadataSha256.update(Buffer.from(metadataJson));
      let metadataHash = metadataSha256.digest();

      // upload it to ipfs
      let metadataContent = { content: metadataJson }
      const metadataCID  = await ipfs.add(metadataContent, { pin: true });

      let mediaData = {
        tokenURI: "https://ipfs.io/ipfs/".concat(contentCID.cid.toString()),
        metadataURI: "https://ipfs.io/ipfs/".concat(metadataCID.cid.toString()),
        contentHash: Uint8Array.from(contentHash),
        metadataHash: Uint8Array.from(metadataHash)
      }

      // mint the thing
      console.log("Minting new media for address: ", wallet.address.toLowerCase());
      await mint(mediaAddress, wallet, mediaData);
    }
  }
  console.log("Completed Seeding GraphQL with Minted Media");
}

startSeed().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});

