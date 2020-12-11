import fs from 'fs'
import sjcl from 'sjcl'

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function sha256FromFile(pathToFile: string, chunkSize: number): Promise<string> {
  const hash = new sjcl.hash.sha256()

  const readStream = fs.createReadStream(pathToFile, { highWaterMark: chunkSize })

  return new Promise<string>((resolve, reject) => {
    readStream.on('data', chunk => {
      hash.update(sjcl.codec.hex.toBits(chunk.toString('hex')))
    })

    readStream.on('end', () => {
      resolve(sjcl.codec.hex.fromBits(hash.finalize()))
    })

    readStream.on('error', err => {
      reject(err)
    })
  })
}
