// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0xe941785b9c9fe6ec6ac2d3a62979440b55b7829378a3787845364966d80b174d
// @eip191signature 0x950cffe647f9928d50763e5554ed4e08789079727bcbbf1a5276326f2bae0d2a3716ac461e443c8a48778a9422fc40e61e9acac8d94a4c3bf486d26fb2c1d1651c

import '@nomicfoundation/hardhat-viem'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import 'hardhat-dependency-compiler'
import { getConfig } from '@andreas-timm/config-ts'
import { type HardhatUserConfig } from 'hardhat/config'
import { register } from 'tsconfig-paths'
import { getNetworks, type ConfigContracts } from './src'

register()

const config = getConfig<ConfigContracts>()
const networks = getNetworks({
    chain: config.chain,
    chain_data: config.chain_data,
})
const report = false
const optimize = false

const hardhatConfig: HardhatUserConfig = {
    solidity: {
        version: '0.8.25',
        settings: optimize
            ? {
                  optimizer: {
                      enabled: true,
                      runs: 1000,
                  },
              }
            : {},
    },
    networks,
    contractSizer: {
        runOnCompile: report,
        // alphaSort: true,
        // disambiguatePaths: false,
        // strict: true,
    },
    gasReporter: {
        enabled: !!process.env.REPORT_GAS || report,
    },
}

// noinspection JSUnusedGlobalSymbols
export default hardhatConfig
