// SPDX-License-Identifier: CC-BY-4.0
// This work is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) License.
// To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/
// Author: Andreas Timm
// Repository: https://github.com/andreas-timm/contract-operate
// @sha256sum 0x136fc2d6b05ce48d610f0349e03b4451e5ff3a23b1a47e32fa02fd29eeb4ccd9
// @eip191signature 0xfba61b1a4877ea98125af4f7f78d32aa346039327ef24660ea25d12419c540222bfb7e4ae2b1109873463605d0209c74cee866ddfc6614f9263248b280f44f861b

import * as os from 'os'

export function expandHome(path: string): string {
    return path.replace(/^~($|\/)/, `${os.homedir()}$1`)
}

export type ArrayWithLength<Len extends number, T extends unknown, Occ extends T[] = []> = Occ['length'] extends Len
    ? Occ
    : ArrayWithLength<Len, T, [T, ...Occ]>

export function createStruct<T>(type: new (...args: any[]) => T, args: any[]): T {
    return new type(...args)
}
