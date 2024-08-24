// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xb1253bc6f61fdf4caf9cadf15e9e47fcb545a60ccf37954542714a8b068e2aad
// @eip191signature 0xcbcdd5eb4a6206336f7879f71c96b427b32f6e1ee188ebc3c9578302db4545ab45f6113f92d14f0ed10c58724379a4a7be26b4a4500238d780945f6dd02bad491c

import hre from 'hardhat'
import { TransactionExecutionError } from 'hardhat/internal/core/providers/errors'
import { type Address, type GetContractReturnType } from 'viem'
import { type ContractWithName } from './types'

export type ContractSize = {
    initSize: number
    initSizeKiB: string
    deployedSize: number
    deployedSizeKiB: string
}

export async function getContractSize(name: string, address: Address): Promise<ContractSize> {
    const artifact = await hre.artifacts.readArtifact(name)
    const initSize = artifact.bytecode.length / 2 - 1
    const initSizeKiB = (initSize / 1024).toFixed(3)

    const publicClient = await hre.viem.getPublicClient()
    const bytecode = (await publicClient.getCode({ address })) as string
    const deployedSize = bytecode.length / 2 - 1
    const deployedSizeKiB = (deployedSize / 1024).toFixed(3)

    return { initSize, initSizeKiB, deployedSize, deployedSizeKiB }
}

export async function getThrow<T, E>(func: () => Promise<T>) {
    let res: T | null = null
    let resErr: E | null = null

    try {
        res = (await func()) as T
    } catch (error) {
        resErr = error as E
    }

    return [res, resErr]
}

export async function getRevertedReason(func: () => Promise<void>): Promise<string | Error> {
    const [_, err] = await getThrow<any, TransactionExecutionError>(func)
    const match = err.details?.match(/.*: reverted with reason string '(.*)'$/)
    return match ? match[1] : err
}

export const EIP170_MAX = 24576

export async function showSize(item: ContractWithName<GetContractReturnType>) {
    const size = await getContractSize(item.name, item.contract.address)
    const sizePercents = ((size.deployedSize / EIP170_MAX) * 100).toFixed(2)
    console.log(`    📏 ${item.name}: ${size.deployedSizeKiB} KiB (${sizePercents}%)`)
}
