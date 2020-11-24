import chai, { expect } from 'chai';
import asPromised from 'chai-as-promised';
import { request, gql } from 'graphql-request';
import {JsonRpcProvider} from '@ethersproject/providers';
import {generatedWallets} from '@zoralabs/media/';
//import {MarketFactory} from '@zoralabs/media/typechain/MarketFactory';
//import {Blockchain} from '@zoralabs/media/utils/Blockchain';

chai.use(asPromised);

const mediaQuery = gql`
    {
        medias(first:10) {
            id
        }
    }
`

const gqlURL = "http://127.0.0.1:8000/subgraphs/name/sporkspatula/zora-v1-subgraph";

describe("Media", async () => {

    let provider = new JsonRpcProvider();
    let [
        wallet1,
        wallet2
    ] = generatedWallets(provider);
    //let blockchain = new Blockchain(provider);

    describe("#mint", async () => {
        it("other example", async () => {
            const response = await request(gqlURL, mediaQuery);
            console.log(response);

            console.log(wallet1.address);
            
            const block = await provider.getBlockNumber();
            console.log(block);
        })
    });

})