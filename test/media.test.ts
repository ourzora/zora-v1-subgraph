import { request } from 'graphql-request'
import { JsonRpcProvider } from '@ethersproject/providers'
import { generatedWallets } from '@zoralabs/core/dist/utils/generatedWallets'
import { Blockchain } from '@zoralabs/core/dist/utils/Blockchain'
import { MarketFactory } from '@zoralabs/core/dist/typechain/MarketFactory'
import { MediaFactory } from '@zoralabs/core/dist/typechain/MediaFactory'
import {
  BigNumber,
  BigNumberish,
  Bytes,
  ContractTransaction,
  ethers,
  Wallet,
} from 'ethers'
import Decimal from '@zoralabs/core/dist/utils/Decimal'
import system from 'system-commands'
import axiosRetry, { isNetworkError } from 'axios-retry'
import axios from 'axios'
import {
  AskQueryResponse,
  BidQueryResponse,
  CurrencyQueryResponse,
  InactiveAsksQueryResponse,
  InactiveBidsQueryResponse,
  Media,
  MediaQueryResponse,
  TransfersQueryResponse,
  URIUpdatesQueryResponse,
  UserQueryResponse,
} from './types'
import {
  askByIdQuery,
  bidByIdQuery,
  currencyByIdQuery,
  inactiveAsksByMediaIdQuery,
  inactiveBidsByMediaIdQuery,
  mediaByIdQuery,
  transfersByFromIdQuery,
  transfersByMediaIdQuery,
  transfersByToIdQuery,
  uriUpdatesByMediaIdQuery,
  uriUpdatesByUpdaterIdQuery,
  userByIdQuery,
} from './queries'
import { delay, exponentialDelay, randomHashBytes, toNumWei } from './utils'
import { BaseErc20Factory } from '@zoralabs/core/dist/typechain'
import { approveCurrency, mintCurrency } from '../utils/currency'
import dotenv from 'dotenv'
import { SolidityAsk, SolidityBid } from '../utils/types'

axiosRetry(axios, {
  retryDelay: exponentialDelay,
  retries: 100,
  retryCondition: isNetworkError,
})
dotenv.config({ path: '.env.local' })
jest.setTimeout(1000000)

const gqlURL = 'http://127.0.0.1:8000/subgraphs/name/sporkspatula/zora-v1-subgraph'
const pathToGraphNode = process.env.PATH_TO_GRAPH

describe('Media', async () => {
  let mediaAddress: string
  let marketAddress: string
  let currencyAddress: string

  let provider = new JsonRpcProvider()
  let blockchain = new Blockchain(provider)
  let [creatorWallet, otherWallet, anotherWallet] = generatedWallets(provider)

  let defaultAsk = (currencyAddress: string) => ({
    currency: currencyAddress, // DAI
    amount: Decimal.new(10).value,
  })

  const defaultBid = (
    currency: string,
    bidder: string,
    recipient: string,
    amountValue?: number,
    sellOnShareValue?: number
  ) => ({
    currency: currency,
    amount: Decimal.new(amountValue || 9).value,
    sellOnShare: Decimal.new(sellOnShareValue || 9),
    bidder: bidder,
    recipient: recipient,
  })

  async function mint(wallet: Wallet, contentHash: Bytes, metadataHash: Bytes) {
    let defaultBidShares = {
      prevOwner: Decimal.new(10),
      owner: Decimal.new(80),
      creator: Decimal.new(10),
    }

    const media = await MediaFactory.connect(mediaAddress, wallet)

    const mediaData = {
      tokenURI: 'example.com',
      metadataURI: 'metadata.com',
      contentHash: contentHash,
      metadataHash: metadataHash,
    }

    await media.mint(mediaData, defaultBidShares)
    await delay(5000)
  }

  async function setAsk(
    wallet: Wallet,
    tokenId: BigNumberish,
    ask: SolidityAsk
  ): Promise<ContractTransaction> {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.setAsk(tokenId, ask)
    await delay(5000)
    return tx
  }

  async function removeAsk(
    wallet: Wallet,
    tokenId: BigNumberish
  ): Promise<ContractTransaction> {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.removeAsk(tokenId)
    await delay(5000)
    return tx
  }

  async function setBid(
    wallet: Wallet,
    tokenId: BigNumberish,
    bid: SolidityBid
  ): Promise<ContractTransaction> {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.setBid(tokenId, bid)
    await delay(5000)
    return tx
  }

  async function removeBid(
    wallet: Wallet,
    tokenId: BigNumberish
  ): Promise<ContractTransaction> {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.removeBid(tokenId)
    await delay(5000)
    return tx
  }

  async function acceptBid(
    wallet: Wallet,
    tokenId: BigNumberish,
    bid: SolidityBid
  ): Promise<ContractTransaction> {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.acceptBid(tokenId, bid)
    await delay(5000)
    return tx
  }

  async function deploy(wallet: Wallet) {
    const market = await (await new MarketFactory(wallet).deploy()).deployed()
    marketAddress = market.address

    const media = await (await new MediaFactory(wallet).deploy(market.address)).deployed()
    mediaAddress = media.address

    await market.configure(mediaAddress)

    const currency = await (
      await new BaseErc20Factory(wallet).deploy('BRECK', 'BRECK', BigNumber.from(18))
    ).deployed()
    currencyAddress = currency.address

    for (const toWallet of generatedWallets(provider)) {
      await mintCurrency(
        wallet,
        currencyAddress,
        toWallet.address,
        BigNumber.from('10000000000000000000000')
      )
      await approveCurrency(toWallet, currencyAddress, marketAddress)
      await delay(1000)
    }

    await delay(5000)
  }

  async function transfer(wallet: Wallet, tokenId: BigNumberish, to: string) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    const tx = await media.transferFrom(wallet.address, to, tokenId)
    let receipt = await provider.getTransactionReceipt(tx.hash)
    await delay(5000)
  }

  async function burn(wallet: Wallet, tokenId: BigNumber) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    await media.burn(tokenId)
    await delay(5000)
  }

  async function approve(wallet: Wallet, tokenId: BigNumber, to: string) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    await media.approve(to, tokenId)
    await delay(5000)
  }

  async function updateTokenURI(wallet: Wallet, tokenId: BigNumber, uri: string) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    await media.updateTokenURI(tokenId, uri)
    await delay(5000)
  }

  async function updateTokenMetadataURI(wallet: Wallet, tokenId: BigNumber, uri: string) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    await media.updateTokenMetadataURI(tokenId, uri)
    await delay(5000)
  }

  async function setApprovalForAll(wallet: Wallet, operator: string, approved: boolean) {
    const media = await MediaFactory.connect(mediaAddress, wallet)
    await media.setApprovalForAll(operator, approved)
    await delay(5000)
  }

  let contentHash: Bytes
  let metadataHash: Bytes
  let currencyDecimals: number
  let currencyName: string
  let currencySymbol: string

  beforeEach(async () => {
    // reset blockchain and deploy
    console.log('Resetting Blockchain')
    await blockchain.resetAsync()
    await blockchain.saveSnapshotAsync()
    console.log('Successfully Reset Blockchain')

    await deploy(creatorWallet)
    console.log('Market Deployed at: ', marketAddress)
    console.log('Media Deployed at: ', mediaAddress)

    // restart graph-node
    console.log('Resetting Graph-Node')
    await system(
      `cd ${pathToGraphNode.concat('/docker')} && docker-compose down && rm -rf ./data`
    )
    await system(`cd ${pathToGraphNode.concat('/docker')} && docker-compose up -d`)
    console.log('Successfully Reset Graph-Node')

    console.log('Waiting for Graph to startup before deploying subgraph')
    await axios.get('http://127.0.0.1:8000/')

    console.log('Creating Subgraph')
    await system(`yarn create-local`)
    console.log('Successfully Created Subgraph')

    await delay(1000)

    console.log('Deploying Subgraph')
    await system(`yarn deploy-local`)
    console.log('Successfully Deployed Subgraph')

    let currencyFactory = BaseErc20Factory.connect(currencyAddress, creatorWallet)
    currencyName = await currencyFactory.name()
    currencySymbol = await currencyFactory.symbol()
    currencyDecimals = await currencyFactory.decimals()
  })

  describe('#mint', async () => {
    it('it should correctly save the minted media and users', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      await mint(creatorWallet, contentHash, metadataHash)

      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      // TODO: Verify BidShares

      expect(media.id).toBe('0')
      expect(media.metadataHash).toBe(ethers.utils.hexlify(metadataHash))
      expect(media.contentHash).toBe(ethers.utils.hexlify(contentHash))
      expect(media.creator.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())

      let zeroUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(ethers.constants.AddressZero)
      )
      let zeroUser = zeroUserResponse.user
      expect(zeroUser.id).toBe(ethers.constants.AddressZero)

      let userResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      let user = userResponse.user

      expect(user.id).toBe(creatorWallet.address.toLowerCase())
      expect(user.collection.length).toBe(1)
      expect(user.collection[0].id).toBe('0')
      expect(user.creations.length).toBe(1)
      expect(user.creations[0].id).toBe('0')

      let otherContentHash = await randomHashBytes()
      let otherMetadataHash = await randomHashBytes()

      let transfersResponse: TransfersQueryResponse = await request(
        gqlURL,
        transfersByMediaIdQuery('0')
      )
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(ethers.constants.AddressZero)
      expect(transfersResponse.transfers[0].to.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      // Mint again with the same address
      await mint(creatorWallet, otherContentHash, otherMetadataHash)

      let mediaResponse1: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('1'))
      let media1 = mediaResponse1.media
      expect(media1.id).toBe('1')

      expect(media1.creator.id).toBe(creatorWallet.address.toLowerCase())
      expect(media1.owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media1.prevOwner.id).toBe(creatorWallet.address.toLowerCase())

      let userResponse2: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      let user2 = userResponse2.user
      expect(user2.id).toBe(creatorWallet.address.toLowerCase())
      expect(user2.collection.length).toBe(2)
      expect(user2.creations.length).toBe(2)

      transfersResponse = await request(gqlURL, transfersByMediaIdQuery('1'))
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(ethers.constants.AddressZero)
      expect(transfersResponse.transfers[0].to.id).toBe(
        creatorWallet.address.toLowerCase()
      )

      // Mint with a new address
      let otherContentHash2 = await randomHashBytes()
      let otherMetadataHash2 = await randomHashBytes()

      await mint(otherWallet, otherContentHash2, otherMetadataHash2)

      let mediaResponse2: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('2'))
      let media2 = mediaResponse2.media
      expect(media2.id).toBe('2')

      expect(media2.creator.id).toBe(otherWallet.address.toLowerCase())
      expect(media2.owner.id).toBe(otherWallet.address.toLowerCase())
      expect(media2.prevOwner.id).toBe(otherWallet.address.toLowerCase())

      let userResponse3: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(otherWallet.address.toLowerCase())
      )
      let user3 = userResponse3.user
      expect(user3.id).toBe(otherWallet.address.toLowerCase())
      expect(user3.collection.length).toBe(1)
      expect(user3.creations.length).toBe(1)

      // transfersResponse = await request(gqlURL, transfersByMediaIdQuery("2"));
      // expect(transfersResponse.transfers.length).toBe(1);
      // expect(transfersResponse.transfers[0].from.id).toBe(zeroAddress);
      // expect(transfersResponse.transfers[0].to.id).toBe(otherWallet.address.toLowerCase());
    })
  })

  describe('transfer', async () => {
    it('it correctly saves state when transfer event is emitted', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()
      // mint (transfer from 0x000 to address)
      await mint(creatorWallet, contentHash, metadataHash)

      // verify 0 address user exists
      let zeroUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(ethers.constants.AddressZero)
      )
      let zeroUser = zeroUserResponse.user
      expect(zeroUser.id).toBe(ethers.constants.AddressZero)

      // verify creator user exists
      let creatorUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      let creatorUser = creatorUserResponse.user
      expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase())

      await transfer(creatorWallet, BigNumber.from(0), otherWallet.address)

      let transfersResponse: TransfersQueryResponse = await request(
        gqlURL,
        transfersByFromIdQuery(creatorWallet.address.toLowerCase())
      )
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].to.id).toBe(otherWallet.address.toLowerCase())
      expect(transfersResponse.transfers[0].media.id).toBe('0')

      // verify other address exists with correct data
      let otherUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(otherWallet.address.toLowerCase())
      )
      let otherUser = otherUserResponse.user
      expect(otherUser.id).toBe(otherWallet.address.toLowerCase())
      expect(otherUser.collection.length).toBe(1)
      expect(otherUser.collection[0].id).toBe('0')
      expect(otherUser.creations.length).toBe(0)

      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.creator.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.owner.id).toBe(otherWallet.address.toLowerCase())
      expect(media.approved).toBeNull()

      // TODO: verify approve gets reset to 0
      await approve(otherWallet, BigNumber.from(0), creatorWallet.address)
      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media
      expect(media.approved.id).toBe(creatorWallet.address.toLowerCase())

      await transfer(otherWallet, BigNumber.from(0), anotherWallet.address)

      // verify anotherUser exists with correct data
      let anotherUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(anotherWallet.address.toLowerCase())
      )
      let anotherUser = anotherUserResponse.user
      expect(anotherUser.id).toBe(anotherWallet.address.toLowerCase())
      expect(anotherUser.collection.length).toBe(1)
      expect(anotherUser.collection[0].id).toBe('0')
      expect(anotherUser.creations.length).toBe(0)

      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.creator.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.owner.id).toBe(anotherWallet.address.toLowerCase())
      expect(media.approved).toBeNull()

      transfersResponse = await request(
        gqlURL,
        transfersByFromIdQuery(otherWallet.address.toLowerCase())
      )
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(
        otherWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].to.id).toBe(
        anotherWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].media.id).toBe('0')

      // burn (transfer from address to 0x0000)
      await transfer(anotherWallet, BigNumber.from(0), creatorWallet.address)

      let anotherTransfersResponse: TransfersQueryResponse = await request(
        gqlURL,
        transfersByFromIdQuery(anotherWallet.address.toLowerCase())
      )
      expect(anotherTransfersResponse.transfers.length).toBe(1)
      expect(anotherTransfersResponse.transfers[0].from.id).toBe(
        anotherWallet.address.toLowerCase()
      )
      expect(anotherTransfersResponse.transfers[0].to.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      expect(anotherTransfersResponse.transfers[0].media.id).toBe('0')

      await burn(creatorWallet, BigNumber.from(0))

      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.creator.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(ethers.constants.AddressZero)
      expect(media.owner.id).toBe(ethers.constants.AddressZero)
      expect(media.burnedAtTimestamp).not.toBeNull()
      expect(media.burnedAtBlockNumber).not.toBeNull()

      let burnTransfersResponse: TransfersQueryResponse = await request(
        gqlURL,
        transfersByToIdQuery(ethers.constants.AddressZero)
      )
      expect(burnTransfersResponse.transfers.length).toBe(1)
      expect(burnTransfersResponse.transfers[0].from.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      expect(burnTransfersResponse.transfers[0].to.id).toBe(ethers.constants.AddressZero)
      expect(burnTransfersResponse.transfers[0].media.id).toBe('0')
    })
  })

  describe('#updateTokenURI', async () => {
    it('should correctly update state when token uri is updated', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()
      // mint (transfer from 0x000 to address)
      await mint(creatorWallet, contentHash, metadataHash)
      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.contentURI).toBe('example.com')

      await updateTokenURI(creatorWallet, BigNumber.from(0), 'content blah blah')

      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.contentURI).toBe('content blah blah')

      let uriUpdateResponse: URIUpdatesQueryResponse = await request(
        gqlURL,
        uriUpdatesByMediaIdQuery('0')
      )
      let uriUpdates = uriUpdateResponse.uriupdates

      expect(uriUpdates.length).toBe(1)
      expect(uriUpdates[0].from).toBe('example.com')
      expect(uriUpdates[0].to).toBe('content blah blah')
      expect(uriUpdates[0].type).toBe('Content')
      expect(uriUpdates[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(uriUpdates[0].updater.id).toBe(creatorWallet.address.toLowerCase())

      // approve then update
      await approve(creatorWallet, BigNumber.from(0), otherWallet.address)
      await updateTokenURI(otherWallet, BigNumber.from(0), 'other blah blah')

      let otherUriUpdateResponse: URIUpdatesQueryResponse = await request(
        gqlURL,
        uriUpdatesByUpdaterIdQuery(otherWallet.address.toLowerCase())
      )
      let otherUriUpdates = otherUriUpdateResponse.uriupdates

      expect(otherUriUpdates.length).toBe(1)
      expect(otherUriUpdates[0].from).toBe('content blah blah')
      expect(otherUriUpdates[0].to).toBe('other blah blah')
      expect(otherUriUpdates[0].type).toBe('Content')
      expect(otherUriUpdates[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(otherUriUpdates[0].updater.id).toBe(otherWallet.address.toLowerCase())
    })
  })
  describe('#updateTokenMetadataURI', async () => {
    it('should correctly update state when metadata uri is updated', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()
      await mint(creatorWallet, contentHash, metadataHash)
      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.metadataURI).toBe('metadata.com')

      await updateTokenMetadataURI(creatorWallet, BigNumber.from(0), 'blah blah')

      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.metadataURI).toBe('blah blah')

      let uriUpdateResponse: URIUpdatesQueryResponse = await request(
        gqlURL,
        uriUpdatesByMediaIdQuery('0')
      )
      let uriUpdates = uriUpdateResponse.uriupdates

      expect(uriUpdates.length).toBe(1)
      expect(uriUpdates[0].from).toBe('metadata.com')
      expect(uriUpdates[0].to).toBe('blah blah')
      expect(uriUpdates[0].type).toBe('Metadata')
      expect(uriUpdates[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(uriUpdates[0].updater.id).toBe(creatorWallet.address.toLowerCase())

      // approve then update
      await approve(creatorWallet, BigNumber.from(0), otherWallet.address)
      await updateTokenMetadataURI(otherWallet, BigNumber.from(0), 'other blah blah')

      let otherUriUpdateResponse: URIUpdatesQueryResponse = await request(
        gqlURL,
        uriUpdatesByUpdaterIdQuery(otherWallet.address.toLowerCase())
      )
      let otherUriUpdates = otherUriUpdateResponse.uriupdates

      expect(otherUriUpdates.length).toBe(1)
      expect(otherUriUpdates[0].from).toBe('blah blah')
      expect(otherUriUpdates[0].to).toBe('other blah blah')
      expect(otherUriUpdates[0].type).toBe('Metadata')
      expect(otherUriUpdates[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(otherUriUpdates[0].updater.id).toBe(otherWallet.address.toLowerCase())
    })
  })

  describe('#approve', async () => {
    it('it should correctly save the approval', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      await mint(creatorWallet, contentHash, metadataHash)
      let mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.approved).toBeNull()

      await approve(creatorWallet, BigNumber.from(0), otherWallet.address)
      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media

      expect(media.id).toBe('0')
      expect(media.approved.id).toBe(otherWallet.address.toLowerCase())
    })
  })

  describe('#setApprovalForAll', async () => {
    it('should correctly save the approval for all', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      await mint(creatorWallet, contentHash, metadataHash)

      let otherContentHash = await randomHashBytes()
      let otherMetadataHash = await randomHashBytes()

      await mint(otherWallet, otherContentHash, otherMetadataHash)

      await setApprovalForAll(creatorWallet, anotherWallet.address, true)

      // approval for new address
      let creatorUserResponse: UserQueryResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      let creatorUser = creatorUserResponse.user
      expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase())
      expect(creatorUser.authorizedUsers.length).toBe(1)
      expect(creatorUser.authorizedUsers[0].id).toBe(anotherWallet.address.toLowerCase())

      // approval for all for existing address
      await setApprovalForAll(creatorWallet, otherWallet.address, true)
      creatorUserResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      creatorUser = creatorUserResponse.user
      expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase())
      expect(creatorUser.authorizedUsers.length).toBe(2)
      expect(creatorUser.authorizedUsers[1].id).toBe(anotherWallet.address.toLowerCase())

      // approval for all revoked for existing address
      await setApprovalForAll(creatorWallet, otherWallet.address, false)
      creatorUserResponse = await request(
        gqlURL,
        userByIdQuery(creatorWallet.address.toLowerCase())
      )
      creatorUser = creatorUserResponse.user
      expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase())
      expect(creatorUser.authorizedUsers.length).toBe(1)
      expect(creatorUser.authorizedUsers[0].id).toBe(anotherWallet.address.toLowerCase())

      // approval for all revoked for non existant address -- this might break stuff
    })
  })

  describe('#setAsk', async () => {
    // setAsk can only be emitted during a call to #setAsk.
    it('should save the proper state', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      await mint(creatorWallet, contentHash, metadataHash)

      let onChainAsk = defaultAsk(currencyAddress)

      const tx = await setAsk(creatorWallet, 0, onChainAsk)
      const txReceipt = await provider.getTransactionReceipt(tx.hash)
      const block = await provider.getBlock(txReceipt.blockHash)

      let askId = '0'.concat('-').concat(creatorWallet.address.toLowerCase())

      // it creates an ask
      let askResponse: AskQueryResponse = await request(gqlURL, askByIdQuery(askId))
      let ask = askResponse.ask
      expect(ask.id).toBe(askId)
      expect(ask.owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(ask.currency.id).toBe(onChainAsk.currency.toLowerCase())
      expect(ask.amount).toBe(toNumWei(onChainAsk.amount).toString())
      expect(ask.createdAtTimestamp).toBe(block.timestamp.toString())
      expect(ask.createdAtBlockNumber).toBe(block.number.toString())

      // it creates a currency
      let currencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let currency = currencyResponse.currency

      expect(currency.id).toBe(currencyAddress.toLowerCase())
      expect(currency.liquidity).toBe('0')
      expect(currency.name).toBe(currencyName)
      expect(currency.decimals).toBe(currencyDecimals)
      expect(currency.symbol).toBe(currencySymbol)

      // create a duplicate ask
      const dupTx = await setAsk(creatorWallet, 0, onChainAsk)
      const dupTxReceipt = await provider.getTransactionReceipt(dupTx.hash)
      const dupBlock = await provider.getBlock(dupTxReceipt.blockHash)

      askResponse = await request(gqlURL, askByIdQuery(askId))
      ask = askResponse.ask
      expect(ask.id).toBe(askId)
      expect(ask.owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(ask.currency.id).toBe(onChainAsk.currency.toLowerCase())
      expect(ask.amount).toBe(toNumWei(onChainAsk.amount).toString())
      expect(ask.createdAtTimestamp).toBe(dupBlock.timestamp.toString())
      expect(ask.createdAtBlockNumber).toBe(dupBlock.number.toString())

      let inactiveAsksResponse: InactiveAsksQueryResponse = await request(
        gqlURL,
        inactiveAsksByMediaIdQuery('0')
      )
      let inactiveAsks = inactiveAsksResponse.inactiveAsks

      expect(inactiveAsks.length).toBe(1)
      expect(inactiveAsks[0].media.id).toBe('0')
      expect(inactiveAsks[0].amount).toBe(toNumWei(onChainAsk.amount).toString())
      expect(inactiveAsks[0].currency.id).toBe(onChainAsk.currency.toLowerCase())
      expect(inactiveAsks[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(inactiveAsks[0].createdAtTimestamp).toBe(block.timestamp.toString())
      expect(inactiveAsks[0].createdAtBlockNumber).toBe(block.number.toString())
      expect(inactiveAsks[0].inactivatedAtTimestamp).toBe(dupBlock.timestamp.toString())
      expect(inactiveAsks[0].inactivatedAtBlockNumber).toBe(dupBlock.number.toString())
    })
  })

  describe('#removeAsk', async () => {
    // it can be called in removeAsk
    // it can be called during a transfer
    it('properly saves state', async () => {
      // mint + setAsk -> removeAsk removes ask and creates inActiveAsk
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      let onChainAsk = defaultAsk(currencyAddress)

      await mint(creatorWallet, contentHash, metadataHash)
      const setAskTx = await setAsk(creatorWallet, 0, onChainAsk)
      const setAskTxReceipt = await provider.getTransactionReceipt(setAskTx.hash)
      const setAskBlock = await provider.getBlock(setAskTxReceipt.blockHash)

      let askId = '0'.concat('-').concat(creatorWallet.address.toLowerCase())

      let askResponse: AskQueryResponse = await request(gqlURL, askByIdQuery(askId))
      expect(askResponse.ask).not.toBeNull()

      const removeAskTx = await removeAsk(creatorWallet, 0)
      const removeAskTxReceipt = await provider.getTransactionReceipt(removeAskTx.hash)
      const removeAskBlock = await provider.getBlock(removeAskTxReceipt.blockHash)

      askResponse = await request(gqlURL, askByIdQuery(askId))
      expect(askResponse.ask).toBeNull()

      let inactiveAsksResponse: InactiveAsksQueryResponse = await request(
        gqlURL,
        inactiveAsksByMediaIdQuery('0')
      )
      let inactiveAsks = inactiveAsksResponse.inactiveAsks

      expect(inactiveAsks.length).toBe(1)
      expect(inactiveAsks[0].media.id).toBe('0')
      expect(inactiveAsks[0].amount).toBe(toNumWei(onChainAsk.amount).toString())
      expect(inactiveAsks[0].currency.id).toBe(onChainAsk.currency.toLowerCase())
      expect(inactiveAsks[0].owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(inactiveAsks[0].createdAtTimestamp).toBe(setAskBlock.timestamp.toString())
      expect(inactiveAsks[0].createdAtBlockNumber).toBe(setAskBlock.number.toString())
      expect(inactiveAsks[0].inactivatedAtTimestamp).toBe(
        removeAskBlock.timestamp.toString()
      )
      expect(inactiveAsks[0].inactivatedAtBlockNumber).toBe(
        removeAskBlock.number.toString()
      )

      //setAsk with new user -> transfer removes ask and creates inActiveAsk
      await setAsk(creatorWallet, 0, onChainAsk)

      askResponse = await request(gqlURL, askByIdQuery(askId))
      expect(askResponse.ask).not.toBeNull()

      await transfer(creatorWallet, 0, otherWallet.address)

      askResponse = await request(gqlURL, askByIdQuery(askId))
      expect(askResponse.ask).toBeNull()

      inactiveAsksResponse = await request(gqlURL, inactiveAsksByMediaIdQuery('0'))
      inactiveAsks = inactiveAsksResponse.inactiveAsks
      expect(inactiveAsks.length).toBe(2)
    })
  })

  describe('#setBid', async () => {
    // it creates a bid
    it('properly saves state', async () => {
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      let onChainBid = defaultBid(
        currencyAddress,
        otherWallet.address,
        otherWallet.address,
        8,
        8
      )
      let onChainAsk = defaultAsk(currencyAddress)

      await mint(creatorWallet, contentHash, metadataHash)
      await setAsk(creatorWallet, 0, onChainAsk)

      const setBidTx = await setBid(otherWallet, 0, onChainBid)
      const setBidTxReceipt = await provider.getTransactionReceipt(setBidTx.hash)
      const setBidBlock = await provider.getBlock(setBidTxReceipt.blockHash)

      let currencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let currency = currencyResponse.currency

      expect(currency.id).toBe(currencyAddress.toLowerCase())
      expect(currency.liquidity).toBe(toNumWei(onChainBid.amount).toString())
      expect(currency.name).toBe(currencyName)
      expect(currency.decimals).toBe(currencyDecimals)
      expect(currency.symbol).toBe(currencySymbol)

      let bidId = '0'.concat('-').concat(otherWallet.address.toLowerCase())

      let bidResponse: BidQueryResponse = await request(gqlURL, bidByIdQuery(bidId))
      let bid = bidResponse.bid

      expect(bid).not.toBeNull()
      expect(bid.id).toBe(bidId)
      expect(bid.amount).toBe(toNumWei(onChainBid.amount).toString())
      expect(bid.currency.id).toBe(onChainBid.currency.toLowerCase())
      expect(bid.sellOnShare).toBe(toNumWei(onChainBid.sellOnShare.value).toString())
      expect(bid.createdAtBlockNumber).not.toBeNull()
      expect(bid.createdAtTimestamp).not.toBeNull()

      // when set bid is called again from same address with higher bid
      let higherOnChainBid = defaultBid(
        currencyAddress,
        otherWallet.address,
        otherWallet.address,
        9,
        9
      )

      const replaceBidTx = await setBid(otherWallet, 0, higherOnChainBid)
      const replaceBidTxReceipt = await provider.getTransactionReceipt(replaceBidTx.hash)
      const replaceBidBlock = await provider.getBlock(replaceBidTxReceipt.blockHash)

      bidResponse = await request(gqlURL, bidByIdQuery(bidId))
      bid = bidResponse.bid

      expect(bid).not.toBeNull()
      expect(bid.id).toBe(bidId)
      expect(bid.amount).toBe(toNumWei(higherOnChainBid.amount).toString())
      expect(bid.currency.id).toBe(higherOnChainBid.currency.toLowerCase())
      expect(bid.sellOnShare).toBe(
        toNumWei(higherOnChainBid.sellOnShare.value).toString()
      )
      expect(bid.createdAtBlockNumber).not.toBeNull()
      expect(bid.createdAtTimestamp).not.toBeNull()

      let inactiveBidsResponse: InactiveBidsQueryResponse = await request(
        gqlURL,
        inactiveBidsByMediaIdQuery('0')
      )
      let inactiveBids = inactiveBidsResponse.inactiveBids

      expect(inactiveBids.length).toBe(1)
      expect(inactiveBids[0].media.id).toBe('0')
      expect(inactiveBids[0].amount).toBe(toNumWei(onChainBid.amount).toString())
      expect(inactiveBids[0].currency.id).toBe(onChainBid.currency.toLowerCase())
      expect(inactiveBids[0].sellOnShare).toBe(
        toNumWei(onChainBid.sellOnShare.value).toString()
      )
      expect(inactiveBids[0].bidder.id).toBe(onChainBid.bidder.toLowerCase())
      expect(inactiveBids[0].recipient.id).toBe(onChainBid.recipient.toLowerCase())
      expect(inactiveBids[0].createdAtTimestamp).toBe(setBidBlock.timestamp.toString())
      expect(inactiveBids[0].createdAtBlockNumber).toBe(setBidBlock.number.toString())
      expect(inactiveBids[0].inactivatedAtTimestamp).toBe(
        replaceBidBlock.timestamp.toString()
      )
      expect(inactiveBids[0].inactivatedAtBlockNumber).toBe(
        replaceBidBlock.number.toString()
      )

      //when the bid is accepted it properly updates
      //the media, the bid, and creates an inactive bid
      let acceptedOnChainBid = defaultBid(
        currencyAddress,
        otherWallet.address,
        otherWallet.address,
        12,
        12
      )
      await setBid(otherWallet, 0, acceptedOnChainBid)
      // make sure bid no longer exists
      bidResponse = await request(gqlURL, bidByIdQuery(bidId))
      expect(bidResponse.bid).toBeNull()

      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media).not.toBeNull()
      expect(media.id).toBe('0')
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.owner.id).toBe(otherWallet.address.toLowerCase())
      expect(media.currentBids.length).toBe(0)
      expect(media.inactiveBids.length).toBe(3)
      expect(media.currentAsk).toBeNull()
      expect(media.approved).toBeNull()

      // it creates a transfer
      let transfersResponse: TransfersQueryResponse = await request(
        gqlURL,
        transfersByFromIdQuery(creatorWallet.address.toLowerCase())
      )
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].to.id).toBe(otherWallet.address.toLowerCase())
      expect(transfersResponse.transfers[0].media.id).toBe('0')

      // if a transfer happens, the prevOwner is not updated until after a bid is accepted.
      await transfer(otherWallet, 0, anotherWallet.address)

      // load media and ensure the prevOwner is still creatorWallet
      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media
      expect(media.owner.id).toBe(anotherWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())

      // set the ask
      await setAsk(anotherWallet, 0, onChainAsk)

      // set the bid with creator Wallet
      let anotherAcceptedOnChainBid = defaultBid(
        currencyAddress,
        creatorWallet.address,
        creatorWallet.address,
        12,
        12
      )
      await setBid(creatorWallet, 0, anotherAcceptedOnChainBid)

      // check if the prevOwner is not otherWallet
      mediaResponse = await request(gqlURL, mediaByIdQuery('0'))
      media = mediaResponse.media
      expect(media.owner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.prevOwner.id).toBe(anotherWallet.address.toLowerCase())

      transfersResponse = await request(
        gqlURL,
        transfersByFromIdQuery(anotherWallet.address.toLowerCase())
      )
      expect(transfersResponse.transfers.length).toBe(1)
      expect(transfersResponse.transfers[0].from.id).toBe(
        anotherWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].to.id).toBe(
        creatorWallet.address.toLowerCase()
      )
      expect(transfersResponse.transfers[0].media.id).toBe('0')
    })
  })

  describe('#removeBid', async () => {
    it('should save state properly', async () => {
      // it removes a bid and creates an InactiveBid
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      let onChainBid = defaultBid(
        currencyAddress,
        otherWallet.address,
        otherWallet.address,
        8,
        8
      )

      await mint(creatorWallet, contentHash, metadataHash)
      const setTx = await setBid(otherWallet, 0, onChainBid)
      const setTxReceipt = await provider.getTransactionReceipt(setTx.hash)
      const setBlock = await provider.getBlock(setTxReceipt.blockHash)

      let currencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let currency = currencyResponse.currency
      expect(currency.id).toBe(currencyAddress.toLowerCase())
      expect(currency.liquidity).toBe(toNumWei(onChainBid.amount).toString())

      let bidId = '0'.concat('-').concat(otherWallet.address.toLowerCase())
      let bidResponse: BidQueryResponse = await request(gqlURL, bidByIdQuery(bidId))
      expect(bidResponse.bid).not.toBeNull()

      const removeTx = await removeBid(otherWallet, 0)
      const removeTxReceipt = await provider.getTransactionReceipt(removeTx.hash)
      const removeBlock = await provider.getBlock(removeTxReceipt.blockHash)

      bidResponse = await request(gqlURL, bidByIdQuery(bidId))
      expect(bidResponse.bid).toBeNull()

      let newCurrencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let newCurrency = newCurrencyResponse.currency
      expect(newCurrency.id).toBe(currencyAddress.toLowerCase())

      let expectedLiquidity = BigNumber.from(currency.liquidity.toString()).sub(
        onChainBid.amount
      )
      expect(BigNumber.from(newCurrency.liquidity.toString())).toMatchObject(
        expectedLiquidity
      )

      let inactiveBidsResponse: InactiveBidsQueryResponse = await request(
        gqlURL,
        inactiveBidsByMediaIdQuery('0')
      )
      let inactiveBids = inactiveBidsResponse.inactiveBids

      expect(inactiveBids.length).toBe(1)
      expect(inactiveBids[0].media.id).toBe('0')
      expect(inactiveBids[0].amount).toBe(toNumWei(onChainBid.amount).toString())
      expect(inactiveBids[0].currency.id).toBe(onChainBid.currency.toLowerCase())
      expect(inactiveBids[0].sellOnShare).toBe(
        toNumWei(onChainBid.sellOnShare.value).toString()
      )
      expect(inactiveBids[0].bidder.id).toBe(onChainBid.bidder.toLowerCase())
      expect(inactiveBids[0].recipient.id).toBe(onChainBid.recipient.toLowerCase())
      expect(inactiveBids[0].createdAtBlockNumber).toBe(
        setTxReceipt.blockNumber.toString()
      )
      expect(inactiveBids[0].createdAtTimestamp).toBe(setBlock.timestamp.toString())
      expect(inactiveBids[0].inactivatedAtTimestamp).toBe(
        removeBlock.timestamp.toString()
      )
      expect(inactiveBids[0].inactivatedAtBlockNumber).toBe(
        removeTxReceipt.blockNumber.toString()
      )
    })
  })

  describe('#acceptBid', async () => {
    it('should save the state properly', async () => {
      // it removes a bid and creates an InactiveBid
      contentHash = await randomHashBytes()
      metadataHash = await randomHashBytes()

      let onChainBid = defaultBid(
        currencyAddress,
        otherWallet.address,
        otherWallet.address,
        8,
        8
      )

      await mint(creatorWallet, contentHash, metadataHash)
      const setBidTx = await setBid(otherWallet, 0, onChainBid)
      const setBidTxReceipt = await provider.getTransactionReceipt(setBidTx.hash)
      const setBidBlock = await provider.getBlock(setBidTxReceipt.blockHash)

      let bidId = '0'.concat('-').concat(otherWallet.address.toLowerCase())
      let bidResponse: BidQueryResponse = await request(gqlURL, bidByIdQuery(bidId))
      expect(bidResponse.bid).not.toBeNull()

      let currencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let currency = currencyResponse.currency
      expect(currency.id).toBe(currencyAddress.toLowerCase())
      expect(currency.liquidity).toBe(toNumWei(onChainBid.amount).toString())

      const acceptBidTx = await acceptBid(creatorWallet, 0, onChainBid)
      const acceptBidTxReceipt = await provider.getTransactionReceipt(acceptBidTx.hash)
      const acceptBidBlock = await provider.getBlock(acceptBidTxReceipt.blockHash)

      bidResponse = await request(gqlURL, bidByIdQuery(bidId))
      expect(bidResponse.bid).toBeNull()

      let inactiveBidsResponse: InactiveBidsQueryResponse = await request(
        gqlURL,
        inactiveBidsByMediaIdQuery('0')
      )
      let inactiveBids = inactiveBidsResponse.inactiveBids

      expect(inactiveBids.length).toBe(1)
      expect(inactiveBids[0].media.id).toBe('0')
      expect(inactiveBids[0].amount).toBe(toNumWei(onChainBid.amount).toString())
      expect(inactiveBids[0].currency.id).toBe(onChainBid.currency.toLowerCase())
      expect(inactiveBids[0].sellOnShare).toBe(
        toNumWei(onChainBid.sellOnShare.value).toString()
      )
      expect(inactiveBids[0].bidder.id).toBe(onChainBid.bidder.toLowerCase())
      expect(inactiveBids[0].recipient.id).toBe(onChainBid.recipient.toLowerCase())
      expect(inactiveBids[0].createdAtBlockNumber).toBe(
        setBidTxReceipt.blockNumber.toString()
      )
      expect(inactiveBids[0].createdAtTimestamp).toBe(setBidBlock.timestamp.toString())
      expect(inactiveBids[0].inactivatedAtTimestamp).toBe(
        acceptBidBlock.timestamp.toString()
      )
      expect(inactiveBids[0].inactivatedAtBlockNumber).toBe(
        acceptBidTxReceipt.blockNumber.toString()
      )

      let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery('0'))
      let media = mediaResponse.media

      expect(media).not.toBeNull()
      expect(media.id).toBe('0')
      expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase())
      expect(media.owner.id).toBe(otherWallet.address.toLowerCase())
      expect(media.currentBids.length).toBe(0)
      expect(media.inactiveBids.length).toBe(1)
      expect(media.currentAsk).toBeNull()
      expect(media.approved).toBeNull()

      let newCurrencyResponse: CurrencyQueryResponse = await request(
        gqlURL,
        currencyByIdQuery(currencyAddress.toLowerCase())
      )
      let newCurrency = newCurrencyResponse.currency
      expect(newCurrency.id).toBe(currencyAddress.toLowerCase())

      let expectedLiquidity = BigNumber.from(currency.liquidity.toString()).sub(
        onChainBid.amount
      )
      expect(BigNumber.from(newCurrency.liquidity.toString())).toMatchObject(
        expectedLiquidity
      )
    })
  })
})
