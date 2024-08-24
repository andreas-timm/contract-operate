// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x002d9919e3eddc2df341a95457ff1f46146f02954c5f3921d1f4e690cd318e6e
// @eip191signature 0x2cb78c4c9e2cbfb1398a33c8f8693b4291c8b36889df093ee3db01369ed56e5b6c7a4db56ea19ff29e5bf4d931ef336e786efa0cb44174df04aef0b3803e09791c

import { type HDAccountsUserConfig } from 'hardhat/src/types/config'
import { type Address } from 'viem'

export interface Chain {
    name: string
    title?: string
    rpc: string[]
    chainId?: number
    faucets?: string[]
    explorers?: Record<string, unknown>[]
}

export interface ChainDevCollection {
    ganache?: Chain
    hardhat?: Chain
}

export interface ChainCollection {
    'scr-sepolia': Chain
    arb1: Chain
    base: Chain
    berachainArtio: Chain
    blastmainnet: Chain
    blastsepolia: Chain
    eth: Chain
    linea: Chain
    matic: Chain
    optrust: Chain
    scr: Chain
    sep: Chain
    zkevm: Chain
    zksync: Chain
    zora: Chain
}

export type ChainCollectionKeys = keyof ChainCollection
export type ChainDevCollectionKeys = keyof ChainDevCollection
export type ChainAllCollectionKeys = ChainCollectionKeys | ChainDevCollectionKeys

export interface Account {
    name: string
    key?: `0x${string}`
    address?: `0x${string}`
    entropyPlain?: string
}

export interface AccountCollection {
    chain: Record<string, Account>
}

export type DeployedDataPath = {
    default: string
    chain: Partial<Record<ChainAllCollectionKeys, string>>
}
export type Version = 'legacy' | `${string}.${string}.${string}`
export type DeployedConnectedMeta = '_'
export type DeployedConnected = Partial<Record<DeployedConnectedMeta, unknown>>
export type DeployedContractVersion = Partial<Record<ChainAllCollectionKeys, Address>> & DeployedConnected
export type DeployedContract = Partial<Record<Version, DeployedContractVersion>>

export type DeployedContracts<T extends string> = Record<T, DeployedContract>

export interface ContractConfig<T extends string> {
    data: Partial<Record<T, { name: string }>>
    abi?: Record<string, string[]>
    deployed_config_path: DeployedDataPath
    deployed: Partial<DeployedContracts<T>>
    admins?: `0x${string}`[]
}

export interface ChainDataChain {
    main?: string
    accounts?: HDAccountsUserConfig
    rpc_index?: number
}

export interface ChainData {
    chain_lists_repo_dir?: string
    chain_data_file_path: string
    chain_file_path: string
    accounts?: HDAccountsUserConfig | string | string[]
    chain: Record<ChainAllCollectionKeys, ChainDataChain>
}
