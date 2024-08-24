import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['./dist/**/*.js'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'error',
            semi: ['error', 'never'],
        },
    },
]
