// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x62e791dd674b89d613eac5d8d23aecfc76e97db978b153a64b712bae5b92e52f
// @eip191signature 0x16cb75631b5b78048cbd562fb652ce269c5cad8422af98efca7258837e5638710aa7b4b4e95709a310246a27a5e78d64d7e42fb3ec8f325983cd05dac2915c341c

export type ContractWithName<T> = {
    name: string
    contract: T
}
