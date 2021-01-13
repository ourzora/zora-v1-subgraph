import { BigNumber, Bytes, ethers } from 'ethers'
import { formatUnits } from '@ethersproject/units'

export function exponentialDelay(retryNumber: number) {
  const delay = Math.pow(2, retryNumber) * 1000
  const randomSum = delay * 0.2 * Math.random() // 0-20% of the delay
  return delay + randomSum
}

export async function randomHashBytes(): Promise<Bytes> {
  return ethers.utils.randomBytes(32)
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function toNumWei(val: BigNumber) {
  return parseFloat(formatUnits(val, 'wei'))
}
