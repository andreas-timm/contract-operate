// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xdab87769292a6b95866180a4049acb99b0533c3930024479bd5f0318d66e45bc
// @eip191signature 0x4f221c8d74359a8f6bebe29a83f3ef6a1b5da24cc0fe936f98a5d13ef8f7cee03f443b4066cf3a92e13f914a7fa1af38f888c2394978afb1f0f6273b2921fe071b

import { mkdirSync, openSync, writeSync } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const rootDir = path.resolve(path.join(__dirname, '..'))
const logsDir = path.join(rootDir, 'data/logs')
const now = new Date().toISOString().replace(/[T:.]/g, '-')
let outFile: number | undefined | null

function onData(chunk: Buffer) {
    const chunkString = chunk.toString()

    const lines = chunkString.split('\n')
    lines.forEach((line, index) => {
        if (line.startsWith('deployed_bytecode:') && line.length > 80) {
            line = `${line.slice(0, 80)}‥`
        }
        const end = index === lines.length - 1 ? '' : '\n'
        process.stdout.write(`${line}${end}`)
    })

    if (outFile !== null) {
        if (outFile === undefined) {
            let outFilePath: string = ''
            if (chunkString.startsWith('log_file:')) {
                const data = yaml.load(chunkString) as { log_file: string | null }
                if (data.log_file === null) {
                    outFile = null
                    console.log('# ℹ️ Logging disabled')
                    return
                } else if (data.log_file) {
                    outFilePath = path.join(logsDir, data.log_file)
                }
            } else {
                outFilePath = path.join(logsDir, `${now}.log`)
            }
            mkdirSync(path.dirname(outFilePath), { recursive: true })
            outFile = openSync(outFilePath, 'w')
        }
        writeSync(outFile, chunk)
    }
}

process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data', onData)
