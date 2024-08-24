// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x65a75917e9e41618cb6c6ac393e3b6c42638712adf5e84ba4e424cec425d3225
// @eip191signature 0x20f74e03b3907754fbc1ead134f92bb548a4c72afe48f4c52f45fc99eca318b911b98795ffbee7c9e10fede38bb7d7cec449076441a921a691bd8d6eba3c15531b

import { execSync } from 'child_process'
import type { HDAccountsUserConfig, NetworksUserConfig } from 'hardhat/types'
import type { ChainAllCollectionKeys, ChainCollection, ChainData, ChainDevCollection } from '..'

export function checkPassShow(value: string) {
    if (value.startsWith('shell:')) {
        value = execSync(value.slice(6), {
            stdio: ['inherit', 'pipe', 'pipe'],
            encoding: 'utf-8',
        }).trim()
    }
    return value
}

export type GetNetworksOptions = {
    chain: ChainCollection & ChainDevCollection
    chain_data?: ChainData
    accounts?: HDAccountsUserConfig | string | string[]
    onlySelected?: boolean
}

export function getNetworks(options: GetNetworksOptions) {
    const networks: NetworksUserConfig = { hardhat: { chainId: 1337 } }

    let globalAccounts: string[] | HDAccountsUserConfig

    if (options.accounts !== undefined) {
        if (typeof options.accounts === 'string') {
            globalAccounts = checkPassShow(options.accounts).split(/\s*[,\n]\s*/gm)
        } else if (Array.isArray(options.accounts)) {
            globalAccounts = options.accounts
        }
    }

    let network: string | null = null
    if (options.onlySelected === true) {
        if (process.env.HARDHAT_NETWORK) {
            network = process.env.HARDHAT_NETWORK
        } else {
            const networkArgIndex = process.argv.indexOf('--network')
            if (networkArgIndex == -1) {
                network = 'hardhat'
            } else {
                network = process.argv[networkArgIndex + 1]
            }
        }
    }

    Object.entries(options.chain).forEach(([chain, data]) => {
        if (network !== null && network !== chain) {
            return
        }

        const rpcIndex = options.chain_data?.chain[chain as ChainAllCollectionKeys]?.rpc_index
        let url: string
        if (rpcIndex) {
            url = data.rpc[rpcIndex]
        } else {
            url = data.rpc.filter((rpc: string) => rpc.indexOf('INFURA_API_KEY') == -1)[0]
        }

        const networkData: {
            chainId: number
            url: string
            accounts?: string[] | HDAccountsUserConfig
            timeout: number
        } = {
            chainId: data.chainId,
            url,
            timeout: 80000,
        }

        if (options.chain_data !== undefined) {
            const chainKey = chain as ChainAllCollectionKeys
            if (options.chain_data.chain[chainKey]?.accounts) {
                const accounts = options.chain_data.chain[chainKey].accounts as HDAccountsUserConfig
                if (Object.prototype.hasOwnProperty.call(accounts, 'mnemonic')) {
                    accounts.mnemonic = checkPassShow(accounts.mnemonic!)
                }
                networkData.accounts = accounts
            } else if (globalAccounts !== undefined) {
                networkData.accounts = globalAccounts
            }
        }

        networks[chain] = networkData
    })

    return networks
}
