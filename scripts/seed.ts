import { JsonRpcProvider } from '@ethersproject/providers'
import { generatedWallets } from '@zoralabs/core/dist/utils/generatedWallets'
import { approveCurrency, deployCurrency, mintCurrency } from '../utils/currency'
import { BigNumber } from 'ethers'
import { Wallet } from '@ethersproject/wallet'
import { promises as fs } from 'fs'
import crypto from 'crypto'
import axios from 'axios'
import fleekStorage from '@fleekhq/fleek-storage-js'
import {
  acceptBid,
  mint,
  removeAsk,
  removeBid,
  setAsk,
  setBid,
  totalSupply,
  transfer,
} from '../utils/media'
import { MarketFactory, MediaFactory } from '@zoralabs/core/dist/typechain'
import Decimal from '@zoralabs/core/dist/utils/Decimal'
import { getRandomInt } from '../utils/utils'
import { AddressZero } from '@ethersproject/constants'
import randomWords from 'random-words'
import { generateMetadata, validateMetadata } from '@zoralabs/zdk'

async function startSeed() {
  // read from chainId.json
  const args = require('minimist')(process.argv.slice(2))

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required')
  }
  const path = `${process.cwd()}/.env${
    args.chainId === 1 ? '.prod' : args.chainId === 4 ? '.dev' : '.local'
  }`
  await require('dotenv').config({path})

  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT)
  const fleekApiKey = process.env.FLEEK_API_KEY
  const fleekApiSecret = process.env.FLEEK_API_SECRET

  let [wallet1, wallet2] = generatedWallets(provider)

  const sharedAddressPath = `${process.cwd()}/config/${args.chainId}.json`
  // @ts-ignore
  const config = JSON.parse(await fs.readFile(sharedAddressPath))

  if (config.mediaAddress == null) {
    throw new Error('media address not specified in config')
  }

  if (config.marketAddress == null) {
    throw new Error('market address not specified in config')
  }

  const mediaAddress = config.mediaAddress
  const marketAddress = config.marketAddress
  const auctionHouseAddress = config.auctionHouseAddress

  if (args.fullMonty) {
    await fullMonty(
      provider,
      wallet1,
      mediaAddress,
      marketAddress,
      auctionHouseAddress,
      fleekApiSecret,
      fleekApiKey
    )
  } else if (args.mint) {
    await mintMedia(provider, mediaAddress, fleekApiSecret, fleekApiKey)
  } else if (args.asks) {
    if (!args.currencyAddress) {
      throw new Error('must specify --currencyAddress')
    }
    const currencyAddress = args.currencyAddress
    await setRandomAsks(
      generatedWallets(provider),
      mediaAddress,
      marketAddress,
      currencyAddress
    )
  } else if (args.bids) {
    if (!args.currencyAddress) {
      throw new Error('must specify --currencyAddress')
    }
    const currencyAddress = args.currencyAddress
    await setRandomBids(generatedWallets(provider), mediaAddress, currencyAddress)
  } else if (args.removeAsks) {
    await removeAsks(generatedWallets(provider), mediaAddress)
  } else if (args.transfers) {
    await randomTransfers(generatedWallets(provider), mediaAddress)
  } else if (args.currency) {
    if (!args.name) {
      throw new Error('must specify --name')
    }

    if (!args.symbol) {
      throw new Error('must specify --symbol')
    }

    setUpNewCurrency(provider, wallet1, marketAddress, args.name, args.symbol)
  } else if (args.bids) {
    if (!args.currencyAddress) {
      throw new Error('must specify --currencyAddress')
    }
    const currencyAddress = args.currencyAddress
    await setRandomBids(generatedWallets(provider), mediaAddress, currencyAddress)
  } else if (args.removeAsks) {
    await removeAsks(generatedWallets(provider), mediaAddress)
  } else if (args.transfers) {
    await randomTransfers(generatedWallets(provider), mediaAddress)
  } else if (args.currency) {
    if (!args.name) {
      throw new Error('must specify --name')
    }

    if (!args.symbol) {
      throw new Error('must specify --symbol')
    }

    await setUpNewCurrency(provider, wallet1, marketAddress, args.name, args.symbol)
  } else if (args.mintCurrency) {
    if (!args.currencyAddress) {
      throw new Error('must specify --currencyAddress')
    }
    const currencyAddress = args.currencyAddress

    console.log('Minting Currency for Each Generated Wallet')
    for (const wallet of generatedWallets(provider)) {
      await mintCurrency(
        wallet1,
        currencyAddress,
        wallet.address,
        BigNumber.from('100000000000000000000000')
      )
    }

    // for each address approve the market max uint256
    console.log('Granting Approval to Market Contract for each Generated Wallet')
    for (const wallet of generatedWallets(provider)) {
      await approveCurrency(wallet, currencyAddress, marketAddress)
    }
  } else if (args.removeBids) {
    await removeBids(generatedWallets(provider), mediaAddress, marketAddress)
  } else if (args.acceptRandomBids) {
    await acceptRandomBids(generatedWallets(provider), mediaAddress, marketAddress)
  } else if (args.mintCurToAddr) {
    if (!args.currencyAddress) {
      throw new Error('must specify --currencyAddress')
    }
    const currencyAddress = args.currencyAddress

    if (!args.toAddr) {
      throw new Error('must specify --toAddr')
    }
    const toAddr = args.toAddr

    await mintCurrency(
      wallet1,
      currencyAddress,
      toAddr,
      BigNumber.from('100000000000000000000000')
    )
  }
}

async function fullMonty(
  provider,
  masterWallet,
  mediaAddress,
  marketAddress,
  auctionHouseAddress,
  fleekApiSecret,
  fleekApiKey
) {
  // deploy DAI
  let breckAddress = await deployCurrency(masterWallet)

  // mint 100,000 DAI for each wallet
  console.log('Currency Address: ', breckAddress)

  console.log('Minting Currency for Each Generated Wallet')
  for (const wallet of generatedWallets(provider)) {
    await mintCurrency(
      masterWallet,
      breckAddress,
      wallet.address,
      BigNumber.from('100000000000000000000000')
    )
  }

  // for each address approve the market max uint256
  console.log('Granting Approval to Market Contract for each Generated Wallet')
  for (const wallet of generatedWallets(provider)) {
    await approveCurrency(wallet, breckAddress, marketAddress)
  }

  await mintMedia(provider, mediaAddress, fleekApiSecret, fleekApiKey)
  await setRandomAsks(
    generatedWallets(provider),
    mediaAddress,
    marketAddress,
    breckAddress
  )
  await setRandomBids(generatedWallets(provider), mediaAddress, breckAddress)

  // await setupRandomAuctions(
  //   generatedWallets(provider),
  //   mediaAddress,
  //   marketAddress,
  //   breckAddress
  // )
}

async function setUpNewCurrency(
  provider: JsonRpcProvider,
  masterWallet: Wallet,
  marketAddress: string,
  name: string,
  symbol: string
) {
  let currencyAddress = await deployCurrency(masterWallet, name, symbol)

  // mint 100,000 BRECK for each wallet
  console.log('Currency Address: ', currencyAddress)

  console.log('Minting Currency for Each Generated Wallet')
  for (const wallet of generatedWallets(provider)) {
    await mintCurrency(
      masterWallet,
      currencyAddress,
      wallet.address,
      BigNumber.from('100000000000000000000000')
    )
  }

  // for each address approve the market max uint256
  console.log('Granting Approval to Market Contract for each Generated Wallet')
  for (const wallet of generatedWallets(provider)) {
    await approveCurrency(wallet, currencyAddress, marketAddress)
  }
}

async function mintMedia(
  provider: JsonRpcProvider,
  mediaAddress: string,
  fleekApiSecret: string,
  fleekApiKey: string
) {
  for (const wallet of generatedWallets(provider)) {
    //const wallets = ['0xe834ec434daba538cd1b9fe1582052b880bd7e63', '0xe36ea790bc9d7ab70c55260c66d52b1eca985f84', '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb', '0x5409ed021d9299bf6814279a6a1411a7e866a631', '0x78dc5d2d739606d31509c31d654056a45185ecb6', '0xa8dda8d7f5310e4a9e24f8eba77e091ac264f872', '0x06cef8e666768cc40cc78cf93d9611019ddcb628', '0x4404ac8bd8f9618d27ad2f1485aa1b2cfd82482d', '0x7457d5e02197480db681d3fdf256c7aca21bdc12']
    // if (wallets.includes(wallet.address.toLowerCase())){
    //   continue;
    // }

    let picsumIds = new Set()

    for (let i = 0; i < 25; i++) {
      const x = getRandomInt(200, 600)
      const y = getRandomInt(200, 600)
      const blur = getRandomInt(1, 10)

      let response = await axios.get(`https://picsum.photos/${x}/${y}`, {
        responseType: 'arraybuffer',
      })
      let picsumId = response.headers['picsum-id']

      while (picsumIds.has(picsumId)) {
        response = await axios.get(`https://picsum.photos/${x}/${y}`, {
          responseType: 'arraybuffer',
        })
        picsumId = response.headers['picsum-id']
      }

      picsumIds.add(picsumId)
      let sha256 = crypto.createHash('sha256')
      sha256.update(response.data)
      let contentHash = sha256.digest()

      // upload the file to ipfs
      const contentCID = await fleekStorage.upload({
        apiKey: fleekApiKey,
        apiSecret: fleekApiSecret,
        key: wallet.address.concat('-').concat(i.toString()),
        data: response.data,
      })

      const randomName = randomWords({min: 2, max: 5, join: ' '})
      const randomDescription = randomWords({exactly: 10, join: ' '})

      const metadata = {
        version: 'zora-20210101',
        name: randomName,
        description: randomDescription,
        mimeType: 'image/jpeg',
      }
      const minified = generateMetadata(metadata.version, metadata)
      const validated = validateMetadata(metadata.version, JSON.parse(minified))

      // hash the metadata
      let metadataSha256 = crypto.createHash('sha256')
      metadataSha256.update(Buffer.from(minified))
      let metadataHash = metadataSha256.digest()

      // upload it to ipfs
      const metadataCID = await fleekStorage.upload({
        apiKey: fleekApiKey,
        apiSecret: fleekApiSecret,
        key: wallet.address.concat('-').concat(
          i
            .toString()
            .concat('-')
            .concat('metadata')
        ),
        data: minified,
      })

      const contentHashString = contentCID.hash.replace(/['"]+/g, '')
      const metadataHashString = metadataCID.hash.replace(/['"]+/g, '')

      console.log('https://ipfs.io/ipfs/'.concat(contentHashString))
      console.log('https://ipfs.io/ipfs/'.concat(metadataHashString))

      let mediaData = {
        tokenURI: 'https://ipfs.io/ipfs/'.concat(contentHashString),
        metadataURI: 'https://ipfs.io/ipfs/'.concat(metadataHashString),
        contentHash: Uint8Array.from(contentHash),
        metadataHash: Uint8Array.from(metadataHash),
      }

      // mint the thing
      console.log('Minting new media for address: ', wallet.address.toLowerCase())
      await mint(mediaAddress, wallet, mediaData)
    }
  }
  console.log('Completed Seeding GraphQL with Minted Media')
}

async function removeBids(
  wallets: Array<Wallet>,
  mediaAddress: string,
  marketAddress: string
) {
  for (const wallet of wallets) {
    const media = MediaFactory.connect(mediaAddress, wallet)
    const market = MarketFactory.connect(marketAddress, wallet)
    const numTokens = await media.balanceOf(wallet.address)
    for (let i = 0; i < numTokens.toNumber(); i++) {
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i)

      if (tokenId.toNumber() % 2 == 0) {
        continue
      }

      console.log(`Removing Bids for Token Id: ${tokenId}`)

      for (const bidder of wallets.filter(w => w != wallet)) {
        console.log(bidder.address)
        let bid = await market.bidForTokenBidder(tokenId, bidder.address)
        if (bid.bidder != AddressZero) {
          console.log(`Removing bid from ${bidder.address} on token id: ${tokenId}`)
          await removeBid(mediaAddress, bidder, tokenId)
        }
      }
    }
  }
}

async function acceptRandomBids(
  wallets: Array<Wallet>,
  mediaAddress: string,
  marketAddress: string
) {
  for (const wallet of wallets) {
    const media = MediaFactory.connect(mediaAddress, wallet)
    const market = MarketFactory.connect(marketAddress, wallet)
    const numTokens = await media.balanceOf(wallet.address)
    for (let i = 0; i < numTokens.toNumber(); i++) {
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i)

      if (tokenId.toNumber() % 2 == 0) {
        continue
      }

      console.log(`Accepting a Bid for Token Id: ${tokenId}`)

      for (const bidder of wallets.filter(w => w != wallet)) {
        console.log(bidder.address)
        let bid = await market.bidForTokenBidder(tokenId, bidder.address)
        if (bid.bidder != AddressZero) {
          console.log(`Accepting bid from ${bidder.address} on token id: ${tokenId}`)
          await acceptBid(mediaAddress, wallet, tokenId, bid)
          break
        }
      }
    }
  }
}

async function setRandomAsks(
  wallets: Array<Wallet>,
  mediaAddress: string,
  marketAddress: string,
  currencyAddress: string
) {
  // for each wallet
  for (const wallet of wallets) {
    const media = MediaFactory.connect(mediaAddress, wallet)
    const market = MarketFactory.connect(marketAddress, wallet)
    const numTokens = await media.balanceOf(wallet.address)
    for (let i = 0; i < numTokens.toNumber(); i++) {
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i)

      if (tokenId.toNumber() % 2 == 0) {
        continue
      }

      // let currentAsk = await market.currentAskForToken(tokenId);
      // if (currentAsk.currency != AddressZero) {
      //   console.log(`Ask: ${currentAsk.toString()} already exists for token: ${tokenId}`);
      //   continue;
      // }

      let ask = {
        currency: currencyAddress,
        amount: Decimal.new(getRandomInt(0, 1000)).value,
      }
      console.log('Setting Ask for Token Id: ', tokenId)
      await setAsk(mediaAddress, wallet, tokenId, ask)
    }
  }
}

async function setRandomBids(
  wallets: Array<Wallet>,
  mediaAddress: string,
  currencyAddress: string
) {
  for (const wallet of wallets) {
    console.log(`Bidding for wallet ${wallet.address}`)
    const media = MediaFactory.connect(mediaAddress, wallet)
    const numTokens = await media.balanceOf(wallet.address)

    for (let j = 0; j < 25; j++) {
      // get each token
      let tokenIds = new Set()

      for (let i = 0; i < numTokens.toNumber(); i++) {
        let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i)
        tokenIds.add(tokenId)
      }

      // do this like 5 times

      // generate a random token to bid on
      const supply = await totalSupply(mediaAddress, wallet)
      console.log(`Total Supply: ${supply}`)
      let randomTokenId = getRandomInt(0, supply.toNumber())

      while (tokenIds.has(randomTokenId)) {
        randomTokenId = getRandomInt(0, supply.toNumber())
      }

      let bid = {
        currency: currencyAddress,
        amount: Decimal.new(getRandomInt(0, 1000)).value,
        sellOnShare: {value: Decimal.new(getRandomInt(0, 10)).value},
        recipient: wallet.address,
        bidder: wallet.address,
      }

      console.log(`Setting bid from ${wallet.address} for token ${randomTokenId}`)
      await setBid(mediaAddress, wallet, BigNumber.from(randomTokenId), bid)
    }
  }
}

async function removeAsks(wallets: Array<Wallet>, mediaAddress: string) {
  for (const wallet of wallets) {
    const media = MediaFactory.connect(mediaAddress, wallet)
    const numTokens = await media.balanceOf(wallet.address)
    for (let i = 0; i < numTokens.toNumber(); i++) {
      let tokenId = await media.tokenOfOwnerByIndex(wallet.address, i)
      console.log('Removing Ask for Token Id: ', tokenId)
      await removeAsk(mediaAddress, wallet, tokenId)
    }
  }
}

async function randomTransfers(wallets: Array<Wallet>, mediaAddress: string) {
  for (const wallet of wallets) {
    const media = MediaFactory.connect(mediaAddress, wallet)

    const numTokens = await media.balanceOf(wallet.address)
    const rand = getRandomInt(0, numTokens.toNumber())
    const tokenId = await media.tokenOfOwnerByIndex(wallet.address, rand)
    const randWalletId = getRandomInt(0, 9)
    console.log(
      `Transferring ${tokenId} from ${wallet.address} to ${wallets[randWalletId].address}.`
    )
    await transfer(mediaAddress, wallet, tokenId, wallets[randWalletId].address)
  }
}

// async function setupRandomAuctions(wallets: Array<Wallet>, mediaAddress: string, auctionHouseAddress: string, currencyAddress: string)

startSeed().catch((e: Error) => {
  console.error(e)
  process.exit(1)
})
