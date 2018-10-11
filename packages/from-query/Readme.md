# @gql2ts/from-query

This package is used to generate types/interfaces from a GraphQL Schema and a query.

## Objective

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

## Basic Usage

```ts
import fromQuery from '@gql2ts/from-query';
import { schema, query } from 'my-graphql-stuff';
import * as fs from 'fs';

const typescriptDefinitions = fromQuery(schema, query);

const allDefinitions = typescriptDefinitions.map(({ result }) => result).join('\n');

fs.writeFile('definition.d.ts', allDefinitions);
```

## Advanced Usage

```ts
import fromQuery from '@gql2ts/from-query';
import { schema, query } from 'my-graphql-stuff';
// see `IOptions` in `types.ts` for options
import * as options from './customFormatters';
import * as fs from 'fs';

const myCustomTypes = {
  Date: 'string',
  Map: 'object',
}

const typescriptDefinitions = fromQuery(schema, query, myCustomTypes, options);

const allDefinitions = typescriptDefinitions.map(({ result }) => result).join('\n');

fs.writeFile('definition.d.ts', allDefinitions);
```
