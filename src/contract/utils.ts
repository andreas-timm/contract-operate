// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xc1a2884a17747c5f39d64127bc8054be42a4dead30b8b40a2c5dd5749c423397
// @eip191signature 0xa76c59d3e564fb29bcabfa778c2398242b29d0b3ac36bc0223748c30b2c3f3511aa7582487e40e18ebca4f06ebc7a598193451a9d6c1befdc1b5c628b3a9f8af1c

import { readFileSync } from 'fs'
import { encodePacked, keccak256 } from 'viem'
import { int32ToVer } from '../version'

export const UINT32_DISCRETION = 4294967295n
export const UINT32_OP_PRECISION = 10e6
export const UINT16 = 65535

export const oneAddress = '0x0000000000000000000000000000000000000001' as const as `0x${string}`

export function getKeccak(value?: `0x${string}`): `0x${string}` {
    return value ? keccak256(value) : `0x${'0'.repeat(64)}`
}

export function getRoleId(name: string): `0x${string}` {
    if (['DEFAULT_ADMIN_ROLE', 'admins'].indexOf(name) > -1) {
        name = ''
    }
    return getKeccak(encodePacked(['string'], [name]))
}

export function toUint32Discretion(value: number): bigint {
    return (BigInt(value * UINT32_OP_PRECISION) * UINT32_DISCRETION) / BigInt(UINT32_OP_PRECISION)
}

export function fromUint64Discretion(value: bigint): number {
    const valueNumber = Number((value * BigInt(UINT32_OP_PRECISION)) / UINT32_DISCRETION) / UINT32_OP_PRECISION
    return parseFloat(valueNumber.toFixed(6))
}

export function getContractSourceVersion(sourceFilePath: string) {
    const contractSource = readFileSync(sourceFilePath, 'utf-8')
    const versionMatch = contractSource.match(/uint32 public constant version = (\d+)/)
    if (!versionMatch) {
        throw new Error('❌ Contract source version not found')
    }
    return int32ToVer(parseInt(versionMatch[1]))
}
