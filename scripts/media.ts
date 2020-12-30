import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Bytes, ethers } from 'ethers';
import { sha256 } from 'ethers/lib/utils';
import {generatedWallets} from '@zoralabs/media/dist/utils/generatedWallets';
import {
  mint,
  updateTokenURI,
  approve,
  approveForAll,
  removeBid,
  burn,
  removeAsk,
  setAsk,
  setBid,
  transfer,
  updateTokenMetadataURI,
  totalSupply
} from "../utils/media";
import {promises as fs} from "fs";
import Decimal from "@zoralabs/media/dist/utils/Decimal";
import crypto from 'crypto';
import ipfsClient from 'ipfs-http-client';
import fleekStorage from "@fleekhq/fleek-storage-js";
import {MediaFactory} from "@zoralabs/media/dist/typechain";
import type = Mocha.utils.type;


async function start(){
  const args = require('minimist')(process.argv.slice(2));

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required');
  }

  if(!args.funcName) {
    throw new Error('--funcName is required');
  }

  const path = `${process.cwd()}/.env${
    args.chainId === 1 ? '.prod' : args.chainId === 4 ? '.dev' : '.local'
  }`;

  const sharedAddressPath = `${process.cwd()}/config/${args.chainId}.json`;
  // @ts-ignore
  const addressBook = JSON.parse(await fs.readFile(sharedAddressPath));

  if (addressBook.mediaAddress == null) {
    throw new Error("media address not specified in addressbook");
  }

  await require('dotenv').config({ path });
  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT);

  let [
    wallet1,
    wallet2,
    wallet3,
    wallet4,
    wallet5
  ] = generatedWallets(provider);


  let contentHex: string;
  let contentHash: string;
  let contentHashBytes: Bytes;

  let metadataHex: string;
  let metadataHash: string;
  let metadataHashBytes: Bytes;

  // switch statement for function with args
  switch (args.funcName){
    case 'mintFromIPFS': {
      // need an ipfs link
      if (!args.ipfsPath){
        throw new Error("--ipfsPath required");
      }

      const ipfsPath = args.ipfsPath;

      if (!args.mimeType){
        throw new Error("--mimeType required");
      }

      const mimeType = args.mimeType;

      const fleekApiKey = process.env.FLEEK_API_KEY;
      const fleekApiSecret = process.env.FLEEK_API_SECRET;

      console.log(ipfsPath);

      const result = await fleekStorage.getFileFromHash({
        hash: ipfsPath,
      })

      //console.log(Buffer.concat(chunks).toString())
      //console.log(Buffer.concat(chunks).toString());

      const contentsha256 = crypto.createHash('sha256');
      contentsha256.update(Buffer.from(result));
      const contentHash = contentsha256.digest();

      // create metadata json, upload to ipfs
      const metadata = {
        version: "0.0.1",
        name: "Lorem Ipsum",
        description: "Lorem Ipsum",
        creator: wallet1.address,
        mimeType: mimeType,
      }

      const metadataJson = JSON.stringify(metadata);

      // hash the metadata
      let metadataSha256 = crypto.createHash('sha256');
      metadataSha256.update(Buffer.from(metadataJson));
      let metadataHash = metadataSha256.digest();

      const balance = await MediaFactory.connect(addressBook.mediaAddress, wallet1).balanceOf(wallet1.address);

      const metadataCID = await fleekStorage.upload({
        apiKey: fleekApiKey,
        apiSecret: fleekApiSecret,
        key: wallet1.address.concat('-').concat(balance.toString().concat("-").concat("metadata")),
        data: metadataJson,
      });

      let mediaData = {
        tokenURI: "https://ipfs.io/ipfs/".concat(ipfsPath),
        metadataURI: "https://ipfs.io/ipfs/".concat(metadataCID.hash),
        contentHash: Uint8Array.from(contentHash),
        metadataHash: Uint8Array.from(metadataHash)
      }

      await mint(addressBook.mediaAddress, wallet1, mediaData);
      break;
      // mint
    }
    case 'mint': {
      const supply = (await totalSupply(addressBook.mediaAddress, wallet1)).toNumber() + 1;

      const metadata = `metadatas:${supply}`;
      console.log("Metadata:", metadata);
      metadataHex = ethers.utils.formatBytes32String(metadata);
      metadataHash = await sha256(metadataHex);
      metadataHashBytes = ethers.utils.arrayify(metadataHash);

      const content = `inverts:${supply}`;
      console.log("Content:", content);
      contentHex = ethers.utils.formatBytes32String(content);
      contentHash = await sha256(contentHex);

      console.log("ContentHash: ", contentHash);
      contentHashBytes = ethers.utils.arrayify(contentHash);

      let mediaData = {
        tokenURI: "who cares",
        metadataURI: "i don't",
        contentHash: contentHashBytes,
        metadataHash: metadataHashBytes
      }

      await mint(addressBook.mediaAddress, wallet1, mediaData);
      break;
    }
    case 'burn': {
      if(!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);
      console.log(tokenId)

      await burn(addressBook.mediaAddress, wallet1, tokenId);
      break;
    }
    case 'updateTokenURI': {
      if(!args.tokenId) {
        throw new Error('--tokenId is required');
      }
      const tokenId = BigNumber.from(args.tokenId);

      if (!args.uri){
        throw new Error('--uri is required');
      }

      const tokenURI = args.uri.toString();
      console.log(addressBook.mediaAddress);

      await updateTokenURI(addressBook.mediaAddress, wallet1, tokenId, tokenURI);
      break;
    }
    case 'updateTokenMetadataURI': {
      if(!args.tokenId) {
        throw new Error('--tokenId is required');
      }
      const tokenId = BigNumber.from(args.tokenId);

      if (!args.uri){
        throw new Error('--uri is required');
      }

      const tokenMetadataURI = args.uri.toString();

      await updateTokenMetadataURI(addressBook.mediaAddress, wallet1, tokenId, tokenMetadataURI);
      break;
    }
    case 'approve': {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);

      if (!args.to){
        throw new Error('--to is required');
      }

      const toAddress = args.to.toString();
      console.log(toAddress);
      await approve(addressBook.mediaAddress, wallet1, tokenId, toAddress);
      break;
    }
    case 'approveForAll': {
      if (!args.operator) {
        throw new Error('--operator is required');
      }
      const operator = args.operator;

      if(!args.approved) {
        throw new Error('--approved is required');
      }


      let approved: boolean;
      if (args.approved.toString() == '0' || args.approved.toString() == 'false') {
        approved = false;
      } else {
        approved = true;
      }

      await approveForAll(addressBook.mediaAddress, wallet1, operator, approved);
      break;
    }
    case 'transfer': {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);

      if (!args.to) {
        throw new Error('--to is required');
      }

      const to = args.to;

      let txHash = await transfer(addressBook.mediaAddress, wallet1, tokenId, to);
      let receipt = await provider.getTransactionReceipt(txHash);
      receipt.logs.forEach((log) =>{
        console.log(log);
      })

      break;
    }
    case 'setAsk': {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);

      let defaultAsk = {
        currency: "eF77ce798401dAc8120F77dc2DebD5455eDdACf9", // DAI
        amount: Decimal.new(10).value,
        sellOnShare: Decimal.new(10),
      }

      await setAsk(addressBook.mediaAddress, wallet1, tokenId, defaultAsk);
      break;
    }
    case 'removeAsk': {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }
      const tokenId = BigNumber.from(args.tokenId);

      await removeAsk(addressBook.mediaAddress, wallet1, tokenId);
      break;
    }
    case `setBid`: {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);

      let defaultBid = {
        currency: "D1aE64401d65E9B0d1bF7E08Fbf75bb2F26eF70a",
        amount: 9,
        sellOnShare: Decimal.new(9),
        recipient: wallet1.address,
        bidder: wallet1.address
      }

      await setBid(addressBook.mediaAddress, wallet2, tokenId, defaultBid);
      break;
    }
    case `removeBid`: {
      if (!args.tokenId) {
        throw new Error('--tokenId is required');
      }

      const tokenId = BigNumber.from(args.tokenId);
      await removeBid(addressBook.mediaAddress, wallet2, tokenId);
      break;
    }
  }
}

start().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});