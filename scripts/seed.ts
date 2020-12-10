import { JsonRpcProvider } from '@ethersproject/providers';
import { generatedWallets } from '@zoralabs/media/dist/utils/generatedWallets';
import { approveCurrency, deployCurrency, mintCurrency } from '../utils/currency';
import {BigNumber, BigNumberish} from 'ethers';
import {Wallet} from "@ethersproject/wallet";
import { promises as fs } from "fs";
import sha256 from 'crypto-js/sha256';
import crypto from 'crypto';
import axios from 'axios';
import fleekStorage from '@fleekhq/fleek-storage-js'
import {mint, removeAsk, setAsk, setBid, totalSupply, transfer} from '../utils/media';
import {MediaFactory} from "@zoralabs/media/dist/typechain";
import {MediaData} from "../utils/types";
import Decimal from "@zoralabs/media/dist/utils/Decimal";
import {getRandomInt} from "../utils/utils";
import {delay} from "../test/utils";


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
  const fleekApiKey = process.env.FLEEK_API_KEY;
  const fleekApiSecret = process.env.FLEEK_API_SECRET;

  let [
    wallet1,
    wallet2
  ] = generatedWallets(provider);

  const sharedAddressPath = `${process.cwd()}/config/${args.chainId}.json`;
  // @ts-ignore
  const config = JSON.parse(await fs.readFile(sharedAddressPath));

  if (config.mediaAddress == null) {
    throw new Error("media address not specified in config");
  }

  if (config.marketAddress == null) {
    throw new Error("market address not specified in config");
  }

  const mediaAddress = config.mediaAddress;
  const marketAddress = config.marketAddress;

  if (args.fullMonty){
    await fullMonty(provider, wallet1, mediaAddress, marketAddress, fleekApiSecret, fleekApiKey);
  } else if (args.mint){
    await mintMedia(provider, mediaAddress, fleekApiSecret, fleekApiKey);
  } else if (args.asks){

    if (!args.currencyAddress){
      throw new Error("must specify --currencyAddress");
    }
    const currencyAddress = args.currencyAddress;
    await setRandomAsks(generatedWallets(provider), mediaAddress, currencyAddress);
  } else if (args.bids){
    if (!args.currencyAddress){
      throw new Error("must specify --currencyAddress");
    }
    const currencyAddress = args.currencyAddress;
    await setRandomBids(generatedWallets(provider), mediaAddress, currencyAddress);
  } else if (args.removeAsks){
      await removeAsks(generatedWallets(provider), mediaAddress);
  } else if (args.transfers){
    await randomTransfers(generatedWallets(provider), mediaAddress);
  }
}

async function fullMonty(provider, masterWallet, mediaAddress, marketAddress, fleekApiSecret, fleekApiKey) {
  // deploy BRECK
  let breckAddress = await deployCurrency(masterWallet);

  // mint 100,000 BRECK for each wallet
  console.log("Currency Address: ", breckAddress);

  console.log("Minting Currency for Each Generated Wallet");
  for (const wallet of generatedWallets(provider)) {
    await mintCurrency(masterWallet, breckAddress, wallet.address, BigNumber.from("100000000000000000000000"));
    await delay(2000);
  }

  // for each address approve the market max uint256
  console.log("Granting Approval to Market Contract for each Generated Wallet");
  for (const wallet of generatedWallets(provider)) {
    await approveCurrency(wallet, breckAddress, marketAddress);
    await delay(2000);
  }

  await mintMedia(provider, mediaAddress, fleekApiSecret, fleekApiKey);
  await setRandomAsks(generatedWallets(provider), mediaAddress, breckAddress);
  await setRandomBids(generatedWallets(provider), mediaAddress, breckAddress);
}

async function mintMedia(provider: JsonRpcProvider, mediaAddress: string, fleekApiSecret: string, fleekApiKey: string) {
  let picsumIds = new Set();

  for (const wallet of generatedWallets(provider)){
    for(let i=0;i<2;i++){
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

      // upload the file to ipfs
      const contentCID = await fleekStorage.upload({
        apiKey: fleekApiKey,
        apiSecret: fleekApiSecret,
        key: wallet.address.concat('-').concat(i.toString()),
        data: response.data,
      });

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
      const metadataCID = await fleekStorage.upload({
        apiKey: fleekApiKey,
        apiSecret: fleekApiSecret,
        key: wallet.address.concat('-').concat(i.toString().concat("-").concat("metadata")),
        data: metadataJson,
      });

      let mediaData = {
        tokenURI: "https://ipfs.io/ipfs/".concat(contentCID.hash),
        metadataURI: "https://ipfs.io/ipfs/".concat(metadataCID.hash),
        contentHash: Uint8Array.from(contentHash),
        metadataHash: Uint8Array.from(metadataHash)
      }

      // mint the thing
      console.log("Minting new media for address: ", wallet.address.toLowerCase());
      await mint(mediaAddress, wallet, mediaData);
      await delay(3000);
    }
  }
  console.log("Completed Seeding GraphQL with Minted Media");
}

async function setRandomAsks(wallets: Array<Wallet>, mediaAddress: string, currencyAddress: string){
  // for each wallet
  for (const wallet of wallets){
    const media = MediaFactory.connect(mediaAddress, wallet);
    const numTokens = await media.balanceOf(wallet.address);
    for(let i = 0; i < numTokens.toNumber(); i++){
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i);
      let ask = {
        currency: currencyAddress,
        amount: Decimal.new(getRandomInt(1000)).value,
        sellOnShare: { value: Decimal.new(getRandomInt(10)).value }
      }
      console.log("Setting Ask for Token Id: ", tokenId);
      await setAsk(mediaAddress, wallet, tokenId, ask);
      await delay(3000);
    }
  }
}

async function setRandomBids(wallets: Array<Wallet>, mediaAddress: string, currencyAddress:string){
  for (const wallet of wallets){
    const media = MediaFactory.connect(mediaAddress, wallet);
    const numTokens = await media.balanceOf(wallet.address);

    // get each token
    let tokenIds = new Set();

    for(let i = 0; i < numTokens.toNumber(); i++){
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i);
      tokenIds.add(tokenId);
    }

    // generate a random token to bid on
    const supply = await totalSupply(mediaAddress, wallet);

    let randomTokenId = getRandomInt(supply.toNumber());
    while (tokenIds.has(randomTokenId)){
      randomTokenId = getRandomInt(supply.toNumber());
    }

    let bid = {
      currency: currencyAddress,
      amount: Decimal.new(getRandomInt(1000)).value,
      sellOnShare: { value: Decimal.new(getRandomInt(10)).value },
      recipient: wallet.address,
      bidder: wallet.address
    }

    await setBid(mediaAddress, wallet, BigNumber.from(randomTokenId), bid);
    await delay(3000);
  }
}

async function removeAsks(wallets: Array<Wallet>, mediaAddress: string){
  for (const wallet of wallets){
    const media = MediaFactory.connect(mediaAddress, wallet);
    const numTokens = await media.balanceOf(wallet.address);
    for(let i = 0; i < numTokens.toNumber(); i++){
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i);
      console.log("Removing Ask for Token Id: ", tokenId);
      await removeAsk(mediaAddress, wallet, tokenId);
      await delay(3000);
    }
  }
}

async function randomTransfers(wallets: Array<Wallet>, mediaAddress: string){
  for(const wallet of wallets){
    const media = MediaFactory.connect(mediaAddress, wallet);

    const numTokens = await media.balanceOf(wallet.address);
    const rand = getRandomInt(numTokens.toNumber());
    const tokenId = await media.tokenOfOwnerByIndex(wallet.address, rand);
    const randWalletId = getRandomInt(9);
    console.log(`Transferring ${tokenId} from ${wallet.address} to ${wallets[randWalletId].address}.`);
    await transfer(mediaAddress, wallet, tokenId, wallets[randWalletId].address);
    await delay(3000);
  }
}


startSeed().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});

