// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xfd8a79a55f3b18ef8beee83c753e5d0a7b923fc996a6e0c4be50ea8ec909c49f
// @eip191signature 0x316676b707fad493d2d9cea9f37d6aee287d06946860ddf64124e96482da11244570a0c9e6c8d7a914f8ff88648d7d21f63c3f64bcf453e204b39485a0e2f6351b

import '@nomicfoundation/hardhat-viem'
import { type GetContractReturnType, type WalletClient } from '@nomicfoundation/hardhat-viem/types'
import hre from 'hardhat'
import { type Address } from 'viem'
import { type DeployedContracts, type Version } from '../../types'
import { getKeccak } from '../utils'
import { Base } from './base'

export type ManageOptions<ContractAlias extends string = string> = {
    deployed: DeployedContracts<ContractAlias>
    contractAlias: ContractAlias
    version: Version | 'last'
}

export class Manage extends Base {
    version: Version | null
    logFile: string | null = null

    constructor(
        public contractAlias: string,
        private readonly options: ManageOptions,
    ) {
        super(options.deployed)
        this.version = options.version === 'last' ? this.getLastVersion(options.contractAlias) : options.version
    }

    async getDeployedContract(version: Version) {
        const address = await this.getDeployedAddress(this.options.contractAlias, version, this.network)
        return address ? await hre.viem.getContractAt(this.contractAlias, address) : null
    }

    async getContract() {
        if (this.version === null) {
            throw new Error(`Contract ${this.options.contractAlias} not deployed`)
        }
        const contract = await this.getDeployedContract(this.version)
        if (!contract) {
            throw new Error(`Contract ${this.options.contractAlias} not deployed for ${this.version}`)
        }
        return contract
    }

    async grantRole(params: {
        namespace?: `0x${string}`
        deployer: WalletClient
        contract: GetContractReturnType
        role: `0x${string}`
        address: Address
    }) {
        const grantParams =
            params.namespace === undefined
                ? [params.role, params.address]
                : [params.namespace, params.role, params.address]

        const hash = await params.contract.write.grantRole(grantParams, {
            account: params.deployer.account,
        })
        return await this.publicClient.waitForTransactionReceipt({ hash })
    }

    async grantRoles(params: {
        namespace?: `0x${string}`
        deployer: WalletClient
        contract: GetContractReturnType
        roles: `0x${string}`[]
        addresses: Address[]
    }) {
        const grantParams =
            params.namespace === undefined
                ? [params.roles, params.addresses]
                : [params.namespace, params.roles, params.addresses]

        const hash = await params.contract.write.grantRoles(grantParams, {
            account: params.deployer.account,
        })
        return await this.publicClient.waitForTransactionReceipt({ hash })
    }

    async grantAdmins(params: {
        admins: Address[]
        namespace?: `0x${string}`
        deployer?: WalletClient
        contract?: GetContractReturnType
        onlyBatch?: boolean
    }) {
        if (params.deployer === undefined) {
            params.deployer = this.walletClients[0]
        }
        if (params.contract === undefined) {
            params.contract = await this.getContract()
        }

        const adminRole = getKeccak()

        // hash = await contract.write.revokeRole([adminRole, admins[0]], {
        //     account: deployer.account,
        // })
        // res = await this.publicClient.waitForTransactionReceipt({ hash })
        // console.log('res:', res)

        let status: string
        let isGranted: boolean

        console.log('grant_admin_role:')

        for await (const adminAddress of params.admins) {
            isGranted = (await params.contract.read.hasRole(
                params.namespace === undefined
                    ? [adminRole, adminAddress]
                    : [params.namespace, adminRole, adminAddress],
            )) as boolean

            if (isGranted) {
                status = '⚠️ already granted'
            } else {
                status = '✅ granted'

                if (params.onlyBatch === true) {
                    await this.grantRoles({
                        namespace: params.namespace,
                        deployer: params.deployer,
                        contract: params.contract,
                        roles: [adminRole],
                        addresses: [adminAddress],
                    })
                } else {
                    await this.grantRole({
                        namespace: params.namespace,
                        deployer: params.deployer,
                        contract: params.contract,
                        role: adminRole,
                        address: adminAddress,
                    })
                }
            }

            console.log(`  - address: '${adminAddress}'`)
            console.log(`    status: ${status}`)
            if (params.namespace !== undefined) {
                console.log(`    namespace: ${params.namespace}`)
            }
        }
    }

    // getTestClients(): WalletClient[] {
    //     return []
    // }

    // async checkBalances(process = false, transfer = false) {
    //     if (!process) return
    //     const clients = this.getTestClients()
    //     const [admin, _, userB, userC, userD] = clients
    //     const clientNames = ['admin', 'userA', 'userB', 'userC', 'userD']
    //     let name: string, client: WalletClient, balance: bigint
    //
    //     if (transfer) {
    //         await this.sendTransaction('admin_to_B', admin, userB.account.address, parseEther('0.001'))
    //         await this.sendTransaction('admin_to_C', admin, userC.account.address, parseEther('0.001'))
    //         await this.sendTransaction('admin_to_D', admin, userD.account.address, parseEther('0.001'))
    //     }
    //
    //     for (const index in clientNames) {
    //         name = clientNames[index]
    //         client = clients[index]
    //         balance = await this.publicClient.getBalance({ address: client.account.address })
    //         console.log(`${name} (${client.account.address}): ${this.formatEther(balance)}Ξ`)
    //     }
    // }

    async initManagement() {
        await this.init()

        if (this.isExtern) {
            this.logFile = `management/${this.options.contractAlias}/${this.network}/${this.fileNameTimestamp}.yaml`
        }

        console.log('---')
        console.log(`log_file: ${this.logFile}`)
        console.log(`contract: ${this.options.contractAlias}`)
    }

    async operations() {}

    async run() {
        await this.initManagement()
        await this.operations()
        return this
    }
}
