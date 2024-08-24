// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Name: version
// Description: Convert a semantic versioning between string and an 32-bit integer.
// Version: 0.1.0
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-test
// Original: https://gist.github.com/dislick/914e67444f8f71df3900bd77ccec6091
// @sha256sum 0xc8db284ab42e6232ec1a8acb4300bf558a1690684f450dc3cb4216a6dbae107e
// @eip191signature 0x9c499b740b4ac23ec940b6280ebef2e88d03b254ae0909e0fb70a3c7b469ddbb6b828b3f5f7a7dc2bffeffa3d8c406e47c14858aae75810a9cbec3e87f65992d1c

/**
 * Convert a semantic versioning string into an 32-bit integer.
 *
 * Make sure the input string is compatible with the standard found
 * at semver.org. Since this only uses 10-bit per major/minor/patch version,
 * the highest possible SemVer string would be 1023.1023.1023.
 * @param  {string} version SemVer string
 * @return {number}         Numeric version
 */

export function verToInt32(version: string): number {
    // Split a given version string into three parts.
    let parts = version.split('.').map((p) => Number(p))
    // Check if we got exactly three parts, otherwise throw an error.
    if (parts.length !== 3) {
        throw new Error('Received invalid version string')
    }
    // Make sure that no part is larger than 1023 or else it
    // won't fit into a 32-bit integer.
    parts.forEach((part) => {
        if (part >= 1024) {
            throw new Error(`Version string invalid, ${part} is too large`)
        }
    })
    // Let's create a new number which we will return later on
    let numericVersion = 0
    // Shift all parts either 0, 10 or 20 bits to the left.
    for (let i = 0; i < 3; i++) {
        numericVersion |= parts[i] << ((2 - i) * 10)
    }

    return numericVersion
}

/**
 * Converts a 32-bit integer into a semantic versioning (SemVer) compatible string.
 * @param  {number} v Numeric version
 * @return {string}   SemVer string
 */
export function int32ToVer(v: number): string {
    // Works by shifting the numeric version to the right and then masking it
    // with 0b1111111111 (or 1023 in decimal).
    return `${(v >> 20) & 1023}.${(v >> 10) & 1023}.${v & 1023}`
}

if (process.argv[1] == __filename) {
    if (process.argv.length < 3) {
        const fileName = require('path').basename(process.argv[1])
        console.log(`Usage: ${fileName} <SEM_VER|INT>`)
        process.exit(1)
    }

    if (process.argv[2].match(/^\d+$/)) {
        console.log(int32ToVer(Number(process.argv[2])))
    } else {
        console.log(verToInt32(process.argv[2]))
    }
}
