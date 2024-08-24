// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x593ef6f75cb4abdd396d1f89fa664b81a5c8e8e9a6a60868e5e0ecf4d010c8dd
// @eip191signature 0x51ff7641053ad92557ba5b800ee07ea4ad105b6316bd5106f7d86b76ac8a431e1265c0d2d0bb2406a670321e57f9bc2fca3a43fc037767f84d79044ccabe6e531c

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Table } from 'console-table-printer'
import { dump, load } from 'js-yaml'
import type { ChainAllCollectionKeys, ChainCollectionKeys, ChainData } from './types'
import { expandHome } from './utils'

interface Chain {
    name: string
    shortName: ChainAllCollectionKeys
    title?: string
    chain: string
    faucets: string[]
    chainId: number
    rpc: string[]
    explorers: Record<string, unknown>[]
}

function getChains(chainsRepoDir: string) {
    const chainsDataDir = expandHome(path.join(chainsRepoDir, '_data/chains'))
    return readdirSync(chainsDataDir).map((file) =>
        JSON.parse(readFileSync(path.join(chainsDataDir, file), 'utf-8')),
    ) as Chain[]
}

function genChains(chainListFile: string, chains: Chain[]) {
    const chainData = getChainData(chainListFile)
    const table = new Table({
        style: {
            headerTop: {
                left: '',
                mid: '',
                right: '',
                other: '',
            },
            headerBottom: {
                left: '',
                mid: '',
                right: '',
                other: '',
            },
            tableBottom: {
                left: '',
                mid: '',
                right: '',
                other: '',
            },
            vertical: '',
        },
        columns: [
            { name: 'Short name', alignment: 'left' },
            { name: 'ChainId', alignment: 'right' },
            { name: 'Name', alignment: 'left' },
            { name: 'Chain', alignment: 'left' },
            { name: 'Test for', alignment: 'left' },
        ],
    })

    chains.forEach((chain) => {
        const title = chain.title && chain.title != chain.name ? ` / ${chain.title}` : ''
        const testFor = chainData.chain[chain.shortName]?.main
        table.addRow({
            'Short name': chain.shortName,
            ChainId: chain.chainId,
            Name: `${chain.name}${title}`,
            Chain: chain.chain,
            'Test for': testFor ?? '',
        })
    })

    // eslint-disable-next-line no-control-regex
    const out = table.render().replace(/\u001b[^m]*?m/g, '')
    const lines = out.split('\n')
    const headLine = lines[1]
    return [headLine, '-'.repeat(headLine.length), ...lines.slice(3, -1)].map((line) => line.slice(1, -1)).join('\n')
}

function getChainData(chainListFile: string) {
    return (load(readFileSync(chainListFile, 'utf-8')) as Record<string, unknown>).chain_data as ChainData
}

function grepShortNames(chainListFile: string, pattern: string | RegExp) {
    genChains(
        chainListFile,
        getChains(chainListFile).filter(
            (chain) =>
                chain.shortName.search(pattern) !== -1 ||
                chain.name.search(pattern) !== -1 ||
                (chain.title ? chain.title.search(pattern) !== -1 : false),
        ),
    )
}

function getUsedChainShortNames(chainListFile: string) {
    return Object.getOwnPropertyNames(getChainData(chainListFile).chain) as ChainCollectionKeys[]
}

function getUsedChains(chainListFile: string) {
    const usedChains = getUsedChainShortNames(chainListFile)

    const keysToFind = [...usedChains]
    const resultMap: Record<ChainCollectionKeys, Chain> = {} as Record<ChainCollectionKeys, Chain>

    getChains(chainListFile).find((chain) => {
        const key = chain.shortName as ChainCollectionKeys
        const index = usedChains.indexOf(key)
        if (index > -1) {
            resultMap[key] = chain
            keysToFind.splice(index, 1)
        }
        return keysToFind.length == 0
    })

    return usedChains.map((key) => resultMap[key])
}

function updateReadme(chainsTable: string, readmePath: string) {
    const readmeLines = readFileSync(readmePath, 'utf-8').split('\n')
    const usedChainIndex = readmeLines.findIndex((line) => line.startsWith('## Used chains'))
    const npmRunIndex =
        usedChainIndex + readmeLines.slice(usedChainIndex).findIndex((line) => line.startsWith('npm run chainList'))
    const endChainListIndex = npmRunIndex + readmeLines.slice(npmRunIndex).findIndex((line) => line.startsWith('```'))

    const readme = [...readmeLines.slice(0, npmRunIndex + 2), chainsTable, ...readmeLines.slice(endChainListIndex)]

    writeFileSync(readmePath, readme.join('\n'))
    console.log('README is updated')
}

function genUsedChains(chainsListFile: string, readmePath: string) {
    const chainsTable = genChains(chainsListFile, getUsedChains(chainsListFile))
    console.log(chainsTable)

    updateReadme(chainsTable, readmePath)
}

function updateChainList(chainsListFile: string) {
    const configChain = getUsedChains(chainsListFile).reduce((acc: Record<string, unknown>, chain) => {
        const data: Record<string, unknown> = {
            name: chain.name,
            chainId: chain.chainId,
            rpc: chain.rpc,
            faucets: chain.faucets,
            explorers: chain.explorers,
        }
        if (chain.title) {
            data.title = chain.title
        }
        acc[chain.shortName] = data
        return acc
    }, {})
    const content = [
        '# Generated config chain list by `shared/chainList.ts`, based on "https://github.com/ethereum-lists/chains.git"',
        dump({ chain: configChain }),
    ].join('\n')
    writeFileSync(chainsListFile, content)
    console.log(`Chains: ${Object.keys(configChain).join(', ')}`)
    console.log(`✅ Config chain file is wrote: ${chainsListFile}`)
}

function showAllSearch(chainsListFile: string) {
    // prettier-ignore
    const patterns = [
        /zk/i,
        /mum/i,
        /scroll/i,
        /sepolia/i,
        /polygon/i,
        /ether/i,
        /base/i,
    ]
    patterns.forEach((pattern) => {
        console.log(pattern)
        grepShortNames(chainsListFile, pattern)
    })
}

if (process.argv.length == 4 && process.argv[2] == 'update') {
    updateChainList(process.argv[3])
} else if (process.argv.length == 4 && process.argv[2] == 'show-all') {
    showAllSearch(process.argv[3])
} else if (process.argv.length == 5 && process.argv[2] == 'gen') {
    genUsedChains(process.argv[3], process.argv[4])
}
