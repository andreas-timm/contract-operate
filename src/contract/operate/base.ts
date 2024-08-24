// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xb784f9fdceec173a98aa6e7948135ce1a3203f6c98da50d9fec2beb29408b58e
// @eip191signature 0xc442ad4250af1ed00a1b8d5b0d1d171280438e321584467c562ad48e42598c944b152427179003e5b7c1197856157c794b9c5a3a5ed820945abdc1048c08518a1c

import { type PublicClient, type WalletClient } from '@nomicfoundation/hardhat-viem/types'
import { expect } from 'chai'
import hre from 'hardhat'
import { formatEther, type Address } from 'viem'
import { type ChainAllCollectionKeys, type DeployedContracts, type Version } from '../../types'
import { int32ToVer, verToInt32 } from '../../version'

export class Base<ContractAlias extends string = string> {
    isExtern = false
    network!: ChainAllCollectionKeys
    walletClients!: WalletClient[]
    publicClient!: PublicClient
    deployer!: WalletClient
    now!: Date
    fileNameTimestamp!: string
    balance: Record<string, bigint[]> = {}

    constructor(private readonly deployed: DeployedContracts<ContractAlias>) {
        this.network = hre.network.name as ChainAllCollectionKeys
        this.isExtern = ['hardhat', 'ganache'].indexOf(this.network) === -1
        this.now = new Date()
        this.fileNameTimestamp = this.now.toISOString().replace(/[T:.]/g, '-')
    }

    async init() {
        this.walletClients = await hre.viem.getWalletClients()
        this.publicClient = await hre.viem.getPublicClient()
        this.deployer = this.walletClients[0]
    }

    formatEther(value: bigint): string {
        return parseFloat(formatEther(value)).toFixed(8)
    }

    async saveBalance(name: string, address: `0x${string}`) {
        if (!this.balance[name]) {
            this.balance[name] = []
        }
        const balance = await this.publicClient.getBalance({ address })
        const diff =
            this.balance[name].length > 0 ? ` (${this.formatEther(balance - this.balance[name].slice(-1)[0])}Ξ)` : ''
        this.balance[name].push(balance)
        console.log(`balance_${name}_${this.balance[name].length - 1}: ${this.formatEther(balance)}Ξ${diff}`)
    }

    async sendTransaction(name: string, from: WalletClient, to: `0x${string}`, value: bigint) {
        const hash = await from.sendTransaction({ to, value })
        await this.publicClient.waitForTransactionReceipt({ hash })
        console.log(`send_transaction/${name}: ${to} ${formatEther(value)}Ξ`)
    }

    eql(a: any, b: any) {
        let fail = true
        try {
            expect(a).to.eql(b)
            fail = false
        } catch {}
        return !fail
    }

    getLastVersion(contractAlias: ContractAlias): Version | null {
        const deployedContract = this.deployed[contractAlias]

        if (deployedContract === undefined) {
            return null
        }

        const allVersions = Object.entries(deployedContract)
            .filter(([, deployed]) => deployed![this.network] !== undefined && deployed![this.network] !== '0x0')
            .map(([version]) => (version == 'legacy' ? 0 : verToInt32(version)))
            .sort()
            .map((version) => (version == 0 ? 'legacy' : int32ToVer(version)))

        if (allVersions.length === 0) {
            return null
        }

        return allVersions.slice(-1)[0] as Version
    }

    async getDeployedAddress(
        contractAlias: ContractAlias,
        version: Version,
        network: ChainAllCollectionKeys,
    ): Promise<Address | null> {
        const deployedContract = this.deployed[contractAlias]

        if (deployedContract === undefined) {
            return null
        }

        const deployedContractVersion = deployedContract[version]
        if (deployedContractVersion === undefined) {
            return null
        }

        return deployedContractVersion[network] ?? null
    }
}
