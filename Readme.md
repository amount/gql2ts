# GQL2TS

[![Greenkeeper badge](https://badges.greenkeeper.io/avantcredit/gql2ts.svg)](https://greenkeeper.io/)
[![npm version](https://badge.fury.io/js/gql2ts.svg)](https://badge.fury.io/js/gql2ts)
[![TravisCI Build Status](https://travis-ci.org/avantcredit/gql2ts.svg?branch=master)](https://travis-ci.org/avantcredit/gql2ts)
[![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/kfa00svxkiqfb4yh/branch/master?svg=true)](https://ci.appveyor.com/project/brettjurgens/gql2ts/branch/master)
[![Coveralls Coverage](https://coveralls.io/repos/github/avantcredit/gql2ts/badge.svg)](https://coveralls.io/github/avantcredit/gql2ts)
[![Reviewed by Hound](https://img.shields.io/badge/Reviewed_by-Hound-8E64B0.svg)](https://houndci.com)

Generate TypeScript type interfaces from GraphQL types and query definitions.

```shell
# for CLI
npm install -g gql2ts

# for programmatic use
npm install @gql2ts/from-query
npm install @gql2ts/from-schema
```

## Structure

This project is a lerna mono repo, consisting of multiple packages.

## Goals and usage

This project can either:

- Take a type schema to generate TS interfaces
- Take a type schema & query and generate TS interfaces

### Generate from type schema

Pass a GraphQL `type` schema to generate a TypeScript interface:

Input:

```graphql
type Query {
  thing: String!
  anotherThing: Boolean!
}
```

Output:

```ts
interface IQuery {
  thing: string;
  anotherThing: boolean;
}
```

## Generate from type schema and query

Pass a `type` and `query` to generate a TypeScript interface:

Input:

```graphql
type Query {
  thing: String!
  anotherThing: Boolean!
}
```

```graphql
query GetThing {
  thing
}
```

Output

```ts
interface GetThing {
  thing: string;
}
```

## Language output

Note that `flow` and `typescript` generator outputs are supported via separate packages:

- `language-flow` - defaults for running `gql2ts` with Flow as your target
- `language-typescript` - defaults for running `gql2ts` with Typescript as your target

### Fine control

If you look into the `index.ts` of either `from-query` or `from-schema` packages:

```js
import {
  DEFAULT_TYPE_MAP,
  DEFAULT_OPTIONS,
} from '@gql2ts/language-typescript';
```

This can be replaced with mathing `flow` configuration objects:

```js
import {
  DEFAULT_TYPE_MAP,
  DEFAULT_OPTIONS,
} from '@gql2ts/language-flow';
```

Note: Flow output support has yet to be packaged and made available for the CLI.

## Packages

See the `packages` directory for package Readmes.

```sh
packages/cli                  # gql2ts CLI
packages/from-query           # @gql2ts/from-query
packages/from-schema          # @gql2ts/from-schema
packages/language-flow        # @gql2ts/language-flow
packages/language-typescript  # @gql2ts/language-typescript
packages/types                # @gql2ts/types
packages/util                 # @gql2ts/util
```
