// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x1c41ead58555939d3244c6e9bdfd79a511efe9716e9d5faa71a7667ea7a0e5b4
// @eip191signature 0x38365d71a41d79d5ad24977af65ba5df2f900803ed6ca7d5872786f5807609f25c127536ea5a801d1340894eb52e6c5a9d533ea793a22d5ba14b78a7fddc13921b

import { readFileSync } from 'fs'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'path'
import { SourceMapMissed } from '@andreas-timm/config-ts'
import hre from 'hardhat'
import { type Artifact } from 'hardhat/types/artifacts'
import { dump, load } from 'js-yaml'
import SourceMap from 'js-yaml-source-map'
import { fileExistsSync } from 'tsconfig-paths/lib/filesystem'
import { type Address } from 'viem'
import type { DeployedContracts, DeployedDataPath } from '../../types'
import { int32ToVer } from '../../version'
import { getContractSourceVersion } from '../utils'
import { Base } from './base'

export type DeployOptions<ContractAlias extends string = string> = {
    force?: boolean
    deployed: DeployedContracts<ContractAlias>
    contractAlias: ContractAlias
    contractData: Record<ContractAlias, { name: string }>
    rootDir: string
    deployedDataPath: DeployedDataPath
}

export class Deploy extends Base {
    contract: string
    logFile: string | null = null
    artifact!: Artifact
    contractSourceVersion!: string
    balance: Record<string, bigint[]> = {}
    deploydAddress: Address | null = null

    constructor(private readonly options: DeployOptions) {
        super(options.deployed)

        const contract = options.contractData[options.contractAlias]?.name
        if (!contract) {
            throw new Error(`Contract data not found for ${options.contractAlias}`)
        }
        this.contract = contract
    }

    async initDeploy() {
        this.log(`---`)

        await this.init()

        this.artifact = await hre.artifacts.readArtifact(this.contract)
        this.contractSourceVersion = getContractSourceVersion(path.join(this.options.rootDir, this.artifact.sourceName))

        if (this.isExtern) {
            this.logFile = `deploy/${this.options.contractAlias}/${this.network}/${this.fileNameTimestamp}.yaml`
        }

        this.log(`log_file: ${this.logFile}`)
    }

    async deploy(name: string, deployArgs?: any[]) {
        const deployedContract = await hre.viem.deployContract(name, deployArgs ?? [], {
            client: { wallet: this.deployer },
        })
        await this.postDeploy(deployedContract.address)
        return deployedContract
    }

    async end() {
        this.log(`result: OK ✅`)
    }

    log(message: string) {
        process.stdout.write(`${message}\n`)
    }

    async updateDeployed(address: `0x${string}`, version: string) {
        const deployedFileName =
            this.options.deployedDataPath.chain[this.network] ?? this.options.deployedDataPath.default
        const deployedFilePath = path.join(this.options.rootDir, deployedFileName)

        if (!fileExistsSync(deployedFilePath)) {
            mkdirSync(path.dirname(deployedFilePath), { recursive: true })
            const out = {
                contract: {
                    deployed: {
                        [this.options.contractAlias]: {
                            [version]: { [this.network]: address },
                        },
                    },
                },
            }
            writeFileSync(deployedFilePath, dump(out))
            this.log(`config_deployed_created: '${deployedFilePath}'`)
        } else {
            const content = readFileSync(deployedFilePath, 'utf-8')
            const map = new SourceMap()
            load(content, { listener: map.listen() })

            const lookupPath = ['contract', 'deployed', this.options.contractAlias, version, this.network]
            const lookup = map.lookup(lookupPath)
            let updatedContent: string | null

            if (lookup === undefined) {
                updatedContent = await this.addDeployedMissed(content, lookupPath, address)
            } else {
                const lines = content.split('\n')
                const updatedLine = lines[lookup.line - 1].replace(/0x\w+/, address)
                updatedContent = content.replace(lines[lookup.line - 1], updatedLine)
            }

            if (updatedContent !== null) {
                writeFileSync(deployedFilePath, updatedContent)
                this.log(`config_deployed_updated: ${deployedFileName}  # ✅`)
            } else {
                this.log(`config_deployed_missed: ⚠️ ${deployedFileName} / ${lookupPath.join('.')}`)
            }
        }
    }

    async addDeployedMissed(content: string, lookupPath: string[], value: any) {
        // TODO: add support of "{}"

        const map = new SourceMapMissed()
        load(content, { listener: map.listen() })
        const lastFound = map.lookup(lookupPath)

        if (lastFound.index > -1 && lastFound.lineEnd !== undefined) {
            const addData = {}
            let currentData: any = addData
            lookupPath.slice(lastFound.index + 1).forEach((key, index) => {
                if (index === lookupPath.length - lastFound.index - 2) {
                    currentData[key] = value
                } else {
                    currentData[key] = {}
                    currentData = currentData[key]
                }
            })
            const add = dump(addData)
                .split('\n')
                .slice(0, -1)
                .map((s) => ' '.repeat(2 * (lastFound.index + 1)) + s)

            const contentLines = content.split('\n')
            return [
                ...contentLines.slice(0, lastFound.lineEnd! + 1),
                ...add,
                ...contentLines.slice(lastFound.lineEnd! + 1),
            ].join('\n')
        }

        return null
    }

    async postDeploy(address: `0x${string}`) {
        const contract = await hre.viem.getContractAt(this.contract, address)

        this.log(`deployed_address: '${address}'`)

        const version = int32ToVer(Number(await contract.read.version()))
        this.log(`deployed_version: ${version}`)

        await this.updateDeployed(address, version)

        await this.saveBalance('deployer', this.deployer.account.address)
    }

    async externWarn() {
        if (this.isExtern) {
            this.log('#')
            process.stdout.write('# timeout 10s‥')
            await new Promise((resolve) => setTimeout(resolve, 10000))
            process.stdout.write('\n')
        }
    }

    async runPrepare() {
        await this.initDeploy()

        this.log(`contract: ${this.options.contractAlias} / ${this.contract} v${this.contractSourceVersion}`)
        this.log(`network: ${hre.network.name}`)
    }

    async runPrepareDeploy() {
        this.log(`deployer: '${this.deployer.account.address}'`)
        await this.saveBalance('deployer', this.deployer.account.address)
        await this.externWarn()
    }

    async run(deployArgs?: any[]) {
        await this.runPrepare()

        // TODO: add time tracker

        const lastVersion = this.getLastVersion(this.options.contractAlias)
        if (this.options.force || lastVersion !== this.contractSourceVersion) {
            await this.runPrepareDeploy()
            const contract = await this.deploy(this.contract, deployArgs)
            this.deploydAddress = contract.address
        } else {
            this.deploydAddress = await this.getDeployedAddress(this.options.contractAlias, lastVersion, this.network)
            this.log(`ℹ️ skip, deployed address: ${this.deploydAddress}`)
        }

        await this.end()
    }
}
