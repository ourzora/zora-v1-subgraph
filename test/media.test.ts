import { request, gql } from 'graphql-request';
import {JsonRpcProvider} from '@ethersproject/providers';
import {generatedWallets} from '@zoralabs/media/utils/generatedWallets';
import {Blockchain} from '@zoralabs/media/utils/Blockchain';
import {MarketFactory} from '@zoralabs/media/typechain/MarketFactory';
import {MediaFactory} from '@zoralabs/media/typechain/MediaFactory';
import { BigNumber, BigNumberish, Bytes } from 'ethers';
import { ethers, Wallet } from 'ethers';
import Decimal from '@zoralabs/media/utils/Decimal';
import system from 'system-commands';
import axiosRetry, {isNetworkError} from "axios-retry";
import axios from 'axios';
import {Media, MediaQueryResponse, UserQueryResponse} from "./types";
import {mediaByIdQuery, userByIdQuery} from "./queries";
import {exponentialDelay, delay, randomHashBytes} from "./utils";

axiosRetry(axios, { retryDelay: exponentialDelay, retries: 100, retryCondition: isNetworkError} );

jest.setTimeout(1000000);
const gqlURL = "http://127.0.0.1:8000/subgraphs/name/sporkspatula/zora-v1-subgraph";
const pathToGraphNode = '/Users/breck/zora/graph-node/docker';
//const pathToSubgraph = '/Users/breck/zora/zora-v1-subgraph';

describe("Media", async () => {
    let mediaAddress;
    let marketAddress;

    let provider = new JsonRpcProvider();
    let blockchain = new Blockchain(provider);
    let [
        creatorWallet,
        otherWallet,
        anotherWallet
    ] = generatedWallets(provider);

    async function mint(wallet: Wallet, contentHash: Bytes, metadataHash: Bytes) {
        let defaultBidShares = {
            prevOwner: Decimal.new(10),
            owner: Decimal.new(80),
            creator: Decimal.new(10),
        };

        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.mint(
            wallet.address,
            "example.com",
            "metadata.com",
            contentHash,
            metadataHash,
            defaultBidShares
        )
        await delay(5000);
    }

    async function deploy(wallet: Wallet) {
        const market = await (
            await new MarketFactory(wallet).deploy()
        ).deployed();
        marketAddress = market.address;

        const media = await (
            await new MediaFactory(wallet).deploy(market.address)
        ).deployed();
        mediaAddress = media.address;

        await market.configure(mediaAddress);
    }

    async function transfer(wallet: Wallet, tokenId: BigNumber, to: string) {
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.transferFrom(wallet.address, to, tokenId);
        await delay(5000);
    }

    async function burn(wallet: Wallet, tokenId: BigNumber) {
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.burn(tokenId);
        await delay(5000);
    }

    async function approve(wallet: Wallet, tokenId: BigNumber, to: string){
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.approve(to, tokenId);
        await delay(5000);
    }

    async function updateTokenURI(wallet: Wallet, tokenId: BigNumber, uri: string){
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.updateTokenURI(tokenId, uri);
        await delay(5000);
    }

    async function updateTokenMetadataURI(wallet: Wallet, tokenId: BigNumber, uri: string){
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.updateTokenMetadataURI(tokenId, uri);
        await delay(5000);
    }

    async function setApprovalForAll(wallet: Wallet, operator: string, approved: boolean){
        const media = await MediaFactory.connect(mediaAddress, wallet);
        await media.setApprovalForAll(operator, approved);
        await delay(5000);
    }

    let contentHash: Bytes;
    let metadataHash: Bytes;

    beforeEach(async () => {
        // reset blockchain and deploy
        console.log("Resetting Blockchain");
        await blockchain.resetAsync();
        await blockchain.saveSnapshotAsync();

        await deploy(creatorWallet);
        console.log("Market Deployed at: ", marketAddress);
        console.log("Media Deployed at: ", mediaAddress);
        console.log("Successfully Reset Blockchain")

        // restart graph-node
        console.log("Resetting Graph-Node");
        await system(`cd ${pathToGraphNode} && docker-compose down && rm -rf ./data`);
        await system(`cd ${pathToGraphNode} && docker-compose up -d`);
        console.log("Successfully Reset Graph-Node");

        console.log("Waiting for Graph to startup before deploying subgraph")
        await axios.get("http://127.0.0.1:8000/");

        console.log("Creating Subgraph");
        await system(`yarn create-local`);
        console.log("Successfully Created Subgraph");

        await delay(1000);

        console.log("Deploying Subgraph");
        await system(`yarn deploy-local`);
        console.log("Successfully Deployed Subgraph");
    });

    describe("#mint", async () => {
        it("it should correctly save the minted media and users", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();

            await mint(creatorWallet, contentHash, metadataHash);

            let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery("0"));
            let media = mediaResponse.media;

            // TODO: Verify BidShares

            expect(media.id).toBe("0");
            expect(media.metadataHash).toBe(ethers.utils.hexlify(metadataHash));
            expect(media.contentHash).toBe(ethers.utils.hexlify(contentHash));
            expect(media.creator.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.owner.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase());

            let zeroUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(ethers.constants.AddressZero));
            let zeroUser = zeroUserResponse.user;
            expect(zeroUser.id).toBe(ethers.constants.AddressZero);


            let userResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            console.log(userResponse);
            let user = userResponse.user;

            expect(user.id).toBe(creatorWallet.address.toLowerCase());
            expect(user.collection.length).toBe(1);
            expect(user.collection[0].id).toBe("0");
            expect(user.creations.length).toBe(1);
            expect(user.creations[0].id).toBe("0");

            let otherContentHash = await randomHashBytes();
            let otherMetadataHash = await randomHashBytes();

            // Mint again with the same address
            await mint(creatorWallet, otherContentHash, otherMetadataHash);

            let mediaResponse1: MediaQueryResponse = await request(gqlURL, mediaByIdQuery("1"));
            let media1 = mediaResponse1.media;
            expect(media1.id).toBe("1");

            expect(media1.creator.id).toBe(creatorWallet.address.toLowerCase());
            expect(media1.owner.id).toBe(creatorWallet.address.toLowerCase());
            expect(media1.prevOwner.id).toBe(creatorWallet.address.toLowerCase());

            let userResponse2: UserQueryResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            let user2 = userResponse2.user;
            expect(user2.id).toBe(creatorWallet.address.toLowerCase());
            expect(user2.collection.length).toBe(2);
            expect(user2.creations.length).toBe(2);

            // Mint with a new address
            let otherContentHash2 = await randomHashBytes();
            let otherMetadataHash2 = await randomHashBytes();

            await mint(otherWallet, otherContentHash2, otherMetadataHash2);

            let mediaResponse2: MediaQueryResponse = await request(gqlURL, mediaByIdQuery("2"));
            let media2 = mediaResponse2.media;
            expect(media2.id).toBe("2");

            expect(media2.creator.id).toBe(otherWallet.address.toLowerCase());
            expect(media2.owner.id).toBe(otherWallet.address.toLowerCase());
            expect(media2.prevOwner.id).toBe(otherWallet.address.toLowerCase());


            let userResponse3: UserQueryResponse = await request(gqlURL, userByIdQuery(otherWallet.address.toLowerCase()));
            let user3 = userResponse3.user;
            expect(user3.id).toBe(otherWallet.address.toLowerCase());
            expect(user3.collection.length).toBe(1);
            expect(user3.creations.length).toBe(1);
       })
    });

    describe("transfer", async () => {
        it("it correctly saves state when transfer event is emitted", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();
            // mint (transfer from 0x000 to address)
            await mint(creatorWallet, contentHash, metadataHash);

            // verify 0 address user exists
            let zeroUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(ethers.constants.AddressZero));
            let zeroUser = zeroUserResponse.user;
            expect(zeroUser.id).toBe(ethers.constants.AddressZero);

            // verify creator user exists
            let creatorUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            let creatorUser = creatorUserResponse.user;
            expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase());

            await transfer(creatorWallet, BigNumber.from(0), otherWallet.address);

            // verify other address exists with correct data
            let otherUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(otherWallet.address.toLowerCase()));
            let otherUser = otherUserResponse.user;
            expect(otherUser.id).toBe(otherWallet.address.toLowerCase());
            expect(otherUser.collection.length).toBe(1);
            expect(otherUser.collection[0].id).toBe("0");
            expect(otherUser.creations.length).toBe(0);

            let mediaResponse: MediaQueryResponse = await request(gqlURL, mediaByIdQuery("0"));
            let media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.creator.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.prevOwner.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.owner.id).toBe(otherWallet.address.toLowerCase());
            expect(media.approved).toBeNull();


            // TODO: verify approve gets reset to 0
            await approve(otherWallet, BigNumber.from(0), creatorWallet.address);
            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;
            expect(media.approved.id).toBe(creatorWallet.address.toLowerCase());


            await transfer(otherWallet, BigNumber.from(0), anotherWallet.address);

            // verify anotherUser exists with correct data
            let anotherUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(anotherWallet.address.toLowerCase()));
            let anotherUser = anotherUserResponse.user;
            expect(anotherUser.id).toBe(anotherWallet.address.toLowerCase());
            expect(anotherUser.collection.length).toBe(1);
            expect(anotherUser.collection[0].id).toBe("0");
            expect(anotherUser.creations.length).toBe(0);

            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.creator.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.prevOwner.id).toBe(otherWallet.address.toLowerCase());
            expect(media.owner.id).toBe(anotherWallet.address.toLowerCase());
            expect(media.approved).toBeNull();

            // burn (transfer from address to 0x0000)
            await transfer(anotherWallet, BigNumber.from(0), creatorWallet.address);
            await burn(creatorWallet, BigNumber.from(0));

            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.creator.id).toBe(creatorWallet.address.toLowerCase());
            expect(media.prevOwner.id).toBe(ethers.constants.AddressZero);
            expect(media.owner.id).toBe(ethers.constants.AddressZero);
        });
    })

    describe("#updateTokenURI", async () => {
        it("should correctly update state when token uri is updated", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();
            // mint (transfer from 0x000 to address)
            await mint(creatorWallet, contentHash, metadataHash);
            let mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            let media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.contentURI).toBe("example.com");

            await updateTokenURI(creatorWallet, BigNumber.from(0), "blah blah");

            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.contentURI).toBe("blah blah");
        });
    })
    describe("#updateTokenMetadataURI", async () => {
        it("should correctly update state when metadata uri is updated", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();
            await mint(creatorWallet, contentHash, metadataHash);
            let mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            let media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.metadataURI).toBe("metadata.com");

            await updateTokenMetadataURI(creatorWallet, BigNumber.from(0), "blah blah");

            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.metadataURI).toBe("blah blah");
        });
    })
    describe("#approve", async () => {
        it("it should correctly save the approval", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();

            await mint(creatorWallet, contentHash, metadataHash);
            let mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            let media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.approved).toBeNull();

            await approve(creatorWallet, BigNumber.from(0), otherWallet.address);
            mediaResponse = await request(gqlURL, mediaByIdQuery("0"));
            media = mediaResponse.media;

            expect(media.id).toBe("0");
            expect(media.approved.id).toBe(otherWallet.address.toLowerCase());
        });
    })

    describe("#setApprovalForAll", async () => {
        it("should correctly save the approval for all", async () => {
            contentHash = await randomHashBytes();
            metadataHash = await randomHashBytes();

            await mint(creatorWallet, contentHash, metadataHash);

            let otherContentHash = await randomHashBytes();
            let otherMetadataHash = await randomHashBytes();

            await mint(otherWallet, otherContentHash, otherMetadataHash);

            await setApprovalForAll(creatorWallet, anotherWallet.address, true);

            // approval for new address
            let creatorUserResponse: UserQueryResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            let creatorUser = creatorUserResponse.user;
            expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase());
            expect(creatorUser.authorizedUsers.length).toBe(1);
            expect(creatorUser.authorizedUsers[0].id).toBe(anotherWallet.address.toLowerCase());

            // approval for all for existing address
            await setApprovalForAll(creatorWallet, otherWallet.address, true);
            creatorUserResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            creatorUser = creatorUserResponse.user;
            expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase());
            expect(creatorUser.authorizedUsers.length).toBe(2);
            expect(creatorUser.authorizedUsers[1].id).toBe(anotherWallet.address.toLowerCase());

            // approval for all revoked for existing address
            await setApprovalForAll(creatorWallet, otherWallet.address, false);
            creatorUserResponse = await request(gqlURL, userByIdQuery(creatorWallet.address.toLowerCase()));
            creatorUser = creatorUserResponse.user;
            expect(creatorUser.id).toBe(creatorWallet.address.toLowerCase());
            expect(creatorUser.authorizedUsers.length).toBe(1);
            expect(creatorUser.authorizedUsers[0].id).toBe(anotherWallet.address.toLowerCase());

            // approval for all revoked for non existant address -- this might break stuff
        });
    })

})
