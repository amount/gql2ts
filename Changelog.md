# Changelog

## 1.7.2

- Fix fragment spread inside of inline fragment [Issue #76](https://github.com/avantcredit/gql2ts/issues/76) [PR #162](https://github.com/avantcredit/gql2ts/issues/162)

## 1.7.1

- Run default fields (`IGraphQLRootResponse`, etc.) through provided formatters [#159](https://github.com/avantcredit/gql2ts/pull/159)

## 1.7.0

- Use native enums in Typescript instead of union type [#116](https://github.com/avantcredit/gql2ts/pull/116)

## 1.6.0

- Improve documentation generation [#154](https://github.com/avantcredit/gql2ts/pull/154)
- Add new line in between Argument Interfaces [#157](https://github.com/avantcredit/gql2ts/pull/157)

## 1.5.2

- Add graphql as dependency for CLI

## 1.5.1

- Move graphql to peer-dependency [#156](https://github.com/avantcredit/gql2ts/pull/156)

## 1.5.0

- Generate Argument Interfaces in `@gql2ts/from-schema` [#148](https://github.com/avantcredit/gql2ts/pull/148)

For example:

```graphql
type Query {
  test(arg1: String!, arg2: Boolean): String
}
```

will output

```typescript
interface ITestOnQueryArguments {
  arg1: string;
  arg2?: boolean;
}
```

- Only warn about prettier once in `@gql2ts/language-typescript` [#147](https://github.com/avantcredit/gql2ts/pull/147)

## 1.4.4

- Loosen `graphql` version restriction to `< 1.0.0` [#152](https://github.com/avantcredit/gql2ts/pull/152)

## 1.4.3

- Fix 1.4.2 release

## 1.4.2

- [#137](https://github.com/avantcredit/gql2ts/pull/137)
  - Remove Typescript 2.7.0 lock
  - Add optional [`prettier`](https://github.com/prettier/prettier) integration to typescript package to pretty-print code
  - Remove custom Typescript formatter

## 1.4.1

- Lock Typescript to <2.7.0 [#132](https://github.com/avantcredit/gql2ts/pull/132)

## 1.4.0

- Allow custom `TypeMap` in `@gql2ts/from-schema`, similar to `@gql2ts/from-query` [#109](https://github.com/avantcredit/gql2ts/pull/109)

## 1.3.0

- Allow GraphQL Schema Language input in CLI

## 1.2.2

- Fix Default Export / CommonJS for `-e` flag on CLI [#99](https://github.com/avantcredit/gql2ts/pull/99)
- Add description JSDoc to individual fields [#96](https://github.com/avantcredit/gql2ts/pull/96)
- Update Some DevDependencies [#94](https://github.com/avantcredit/gql2ts/pull/94)

## 1.2.1

- Pin version of `graphql` to `^0.10.5` in all packages [#89](https://github.com/avantcredit/gql2ts/pull/89)

## 1.2.0

### Breaking Changes

- Use string literal for `__typename` [#87](https://github.com/avantcredit/gql2ts/pull/87), for instance:

```ts
interface IWhatever {
  __typename: "Whatever";
}
```

## 1.1.3

- Fix [Issue #85](https://github.com/avantcredit/gql2ts/issues/85) [#86](https://github.com/avantcredit/gql2ts/pull/86)

## 1.1.2

- Expose `ignoreTypeNameDeclaration` in the CLI. Use `--ignore-type-name-declaration` to enable it [#81](https://github.com/avantcredit/gql2ts/pull/81)

## 1.1.1

- Merge back changes from `1.0.3`

## 1.1.0 (botched)

### @gql2ts/from-schema

- Add option `ignoreTypeNameDeclaration` to not add `__typename` to all fields (thanks [@epicallan](https://github.com/epicallan)) [#72](https://github.com/avantcredit/gql2ts/pull/72)

## 1.0.3

- Update `graphql` dependency to `0.10.1`

## 1.0.2

- Fix the fix for unions from `1.0.1`

## 1.0.1

- Fix `@gql2ts/from-schema` not handling Unions properly [#66](https://github.com/avantcredit/gql2ts/pull/66)

## 1.0.0

- Use lerna to manage multiple packages
- Rewrite in Typescript
- Introduce `@gql2ts/from-query` which generates definitions from a schema and a query
- Extract common code to `@gql2ts/util`
- Accept more objects from a schema
  - `{ data: IntrospectionQuery }`
  - `IntrospectionQuery`
  - `GraphQLSchema` object
  - GraphQL Language Schema

### Breaking Changes

- Drop support for node v4/v5

## 0.6.1

- Fix bug where the help was outputted when `stdin` and `stdout` are used with no options

## 0.6.0

- Can now accept input from `stdin`
- Can now write to `stdout`

### Breaking Changes

- Output will now default to `stdout`, must specify `-o` to write to a file

## 0.5.1

- Add `tslint:disable` to generated files - [@AdirAmsalem](https://github.com/AdirAmsalem) [#38](https://github.com/avantcredit/gql2ts/pull/38)
- Update `graphql` dependency [#29](https://github.com/avantcredit/gql2ts/pull/29)

## 0.5.0

- Adds support for nullability attributes inside derived interfaces - [@neelance](https://github.com/neelance) [@orta](https://github.com/orta) [#34](https://github.com/avantcredit/gql2ts/pull/34).
  - Note that for older versions of TypeScript, you can use the CLI flag `--legacy` to get output without nullability references.

## 0.4.0

- Stop extending `GraphQLInterface`s with their possible types. (thanks [@tomaba](https://github.com/tomaba)) [#25](https://github.com/avantcredit/gql2ts/pull/25)
  - Previously, if two possible types implement a similar field, but with a different type it will cause an error

## 0.3.1

- Accept `__schema` at the top level [#20](https://github.com/avantcredit/gql2ts/pull/20)

## 0.3.0

### Breaking Changes

- Change from `module` to `namespace` [#14](https://github.com/avantcredit/gql2ts/pull/14)
- Removed `-m`/`--module-name` flag in favor of `-n`/`--namespace`

### Patches

- Fix for `Int` Scalar Type (thanks [@valorize](https://github.com/valorize)) [#15](https://github.com/avantcredit/gql2ts/pull/15)

## 0.2.1

- Fix Version number in command line

## 0.2.0

- Add support for Enums

## 0.1.0

- Add Root Entry Points & Error Map
- Add `__typename` to the generated interfaces

## 0.0.4

- Include polyfill `Array.prototype.includes` for node v4/v5 compatibility
- Add test suite

## 0.0.3

- Fix for node v5 strict mode

## 0.0.2

- Add information to npm

## 0.0.1

- Initial Release
