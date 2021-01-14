import { BaseErc20Factory } from '@zoralabs/core/dist/typechain'
import { generatedWallets } from '@zoralabs/core/dist/utils/generatedWallets'
import { JsonRpcProvider } from '@ethersproject/providers'
import { MaxUint256 } from '@ethersproject/constants'
import { deployCurrency } from '../utils/currency'

async function start() {
  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT)
  const args = require('minimist')(process.argv.slice(2))

  let [wallet1, wallet2, wallet3, wallet4, wallet5] = generatedWallets(provider)

  switch (args.funcName) {
    case 'deploy': {
      console.log('Deploying Bid Currency...')
      const currencyAddress = await deployCurrency(wallet2)
      console.log(`Bid Currency deployed at ${currencyAddress}`)
      break
    }
    case 'allow': {
      if (!args.tokenAddress) {
        throw new Error('require --tokenAddress args')
      }

      if (!args.to) {
        throw new Error('require --to args')
      }

      const erc20 = BaseErc20Factory.connect(args.tokenAddress, wallet2)
      const tx = await erc20.approve(args.to, MaxUint256)
      console.log(tx)
      break
    }
    case 'allowanceOf': {
      if (!args.tokenAddress) {
        throw new Error('require --tokenAddress args')
      }

      if (!args.to) {
        throw new Error('require --to args')
      }

      const erc20 = BaseErc20Factory.connect(args.tokenAddress, wallet2)
      const tx = await erc20.allowance(wallet2.address, args.to)
      console.log(tx.toString())
      break
    }
    case 'balance': {
      if (!args.tokenAddress) {
        throw new Error('require --tokenAddress args')
      }

      const erc20 = BaseErc20Factory.connect(args.tokenAddress, wallet2)
      const tx = await erc20.balanceOf(wallet2.address)
      console.log(tx.toString())
      break
    }
    case 'mint': {
      const erc20 = BaseErc20Factory.connect(args.tokenAddress, wallet2)
      const tx = await erc20.mint(wallet2.address, 100000000000000)
      console.log(tx)
      break
    }
  }
}

start().catch((e: Error) => {
  console.error(e)
  process.exit(1)
})
