#!/usr/bin/env bash

set -e

rm -rf dist
tsc -p tsconfig.json
tsc -p tsconfig-cjs.json

mkdir dist/src
rsync -a src/ dist/src/
cp LICENSE dist/
grep -v '[![test](https://github.com/' README.md \
> dist/README.md

COPY_FIELDS=(
    name
    description
    version
    keywords
    author
    license
    homepage
    repository
    bugs
    dependencies
)

cd dist
npm init -y > /dev/null

for field in "${COPY_FIELDS[@]}"; do
    npm pkg set --json "${field}"="$(npm --prefix=.. pkg get --json "${field}")"
done

npm pkg delete scripts
npm pkg delete directories
npm pkg set main=./lib/cjs/index.js
npm pkg set module=./lib/esm/index.js

cat package.json
