import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { generatedWallets, privateKeys } from '@zoralabs/core/dist/utils/generatedWallets'
import { promises as fs } from "fs"
import { MediaFactory } from '@zoralabs/core/dist/typechain'
import { AuctionHouse__factory } from '@zoralabs/auction-house/dist/typechain'
import { BigNumber, ethers } from 'ethers'

async function runAuction() {
  const args = require('minimist')(process.argv.slice(2))

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required')
  }
  if(!args.tokenId && args.tokenId !==  0) {
    throw new Error('--tokenId is required')
  }
  const path = `${process.cwd()}/.env${
    args.chainId === 1 ? '.prod' : args.chainId === 4 ? '.dev' : '.local'
  }`
  await require('dotenv').config({path})

  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT)

  let [creator, curator, bidder1, bidder2] = privateKeys.map((pk) => new Wallet(pk, provider))

  const sharedAddressPath = `${process.cwd()}/config/${args.chainId}.json`
  // @ts-ignore
  const config = JSON.parse(await fs.readFile(sharedAddressPath))

  if (config.mediaAddress === null) {
    throw new Error('media address not specified in config')
  }

  if (config.marketAddress === null) {
    throw new Error('market address not specified in config')
  }

  if(config.auctionHouseAddress === null) {
    throw new Error('auctionHouse address not specified in config')
  }

  const { mediaAddress, marketAddress, auctionHouseAddress} = config;

  const TENTH_ETH = ethers.utils.parseUnits("0.1", "ether") as BigNumber;
  const ONE_ETH = ethers.utils.parseUnits("1", "ether") as BigNumber;
  const TWO_ETH = ethers.utils.parseUnits("2", "ether") as BigNumber;
  const ONE_DAY = 24 * 60 * 60;

  const media = MediaFactory.connect(mediaAddress, creator)
  // @ts-ignore
  const auction = AuctionHouse__factory.connect(auctionHouseAddress, creator)

  // Approve the auction
  console.log('approving transfer to auction')
  await (await media.approve(auctionHouseAddress, args.tokenId)).wait()


  // Create the auction
  console.log('creating auction')
  await (await auction.createAuction(args.tokenId, mediaAddress, ONE_DAY, TENTH_ETH.toString(), curator.address, 15, ethers.constants.AddressZero)).wait()

  console.log('approving auction as curator')
  // @ts-ignore
  await (await auction.connect(curator).setAuctionApproval(mediaAddress, args.tokenId, true)).wait()

  console.log('Creating first bid')
  await auction
    // @ts-ignore
    .connect(bidder1)
    .createBid(media.address, 0, ONE_ETH.toString(), { value: ONE_ETH.toString() });

  console.log('Creating second bid')
  await auction
    // @ts-ignore
    .connect(bidder2)
    .createBid(media.address, 0, TWO_ETH.toString(), { value: TWO_ETH.toString() });

  console.log('fast forwarding time')
  await provider.send("evm_increaseTime", [
    ONE_DAY
  ]);

  await auction.endAuction(media.address, args.tokenId);
}


runAuction().then()