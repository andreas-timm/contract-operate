/** @type {import("prettier").Config} */
const config = {
    printWidth: 120,
    tabWidth: 4,
    singleQuote: true,
    jsxSingleQuote: true,
    semi: false,
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
}

// noinspection JSUnusedGlobalSymbols
export default config
