# GQL2TS

[![Greenkeeper badge](https://badges.greenkeeper.io/avantcredit/gql2ts.svg)](https://greenkeeper.io/)

[![npm version](https://badge.fury.io/js/gql2ts.svg)](https://badge.fury.io/js/gql2ts)
[![TravisCI Build Status](https://travis-ci.org/avantcredit/gql2ts.svg?branch=master)](https://travis-ci.org/avantcredit/gql2ts)
[![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/kfa00svxkiqfb4yh/branch/master?svg=true)](https://ci.appveyor.com/project/brettjurgens/gql2ts/branch/master)
[![Coveralls Coverage](https://coveralls.io/repos/github/avantcredit/gql2ts/badge.svg)](https://coveralls.io/github/avantcredit/gql2ts)

Generate TypeScript interfaces (or Flow) from GraphQL schema and query definitions.

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

- Take a schema and generate type definitions from it
- Take a schema & a query and generate type definitions from it

### Generate from schema

Takes a type schema

```txt
type Query {
  thing: String!
  anotherThing: Boolean!
}
```

Generates TypeScript interface

```txt
interface IQuery {
  thing: string;
  anotherThing: boolean;
}
```

## Generate from schema and query

Takes a type schema

```txt
type Query {
  thing: String!
  anotherThing: Boolean!
}
```

and a Query

```txt
query GetThing {
  thing
}
```

Generates TypeScript interface

```txt
interface GetThing {
  thing: string;
}
```

Note that both `flow` and `typescript` generator outputs are supported via separate packages:

- `language-flow` - set of defaults for running `gql2ts` with Flow as your target.
- `language-typescript` - set of defaults for running `gql2ts` with Typescript as your target.

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
