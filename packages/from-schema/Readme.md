# @gql2ts/from-schema

This package is used to generate a namespace for a GraphQL Schema with all possible interfaces/types included.

## Objective

Pass a GraphQL `type` schema and `query` to generate a TypeScript interface:

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

Output:

```ts
interface GetThing {
  thing: string;
}
```

## Basic Usage

```ts
import { generateNamespace } from '@gql2ts/from-schema';
import { schema } from 'my-graphql-stuff';
import * as fs from 'fs';

const myNamespace = generateNamespace('MyGraphQL', schema);
fs.writeFile('mySchema.d.ts', myNamespace);
```

## Advanced Usage

```ts
import { generateNamespace, ISchemaToInterfaceOptions } from '@gql2ts/from-schema';
import { schema } from 'my-graphql-stuff';
import { IFromQueryOptions } from '@gql2ts/types';
import * as fs from 'fs';

const options: Partial<ISchemaToInterfaceOptions> = {
  ignoredTypes: ['BadGraphType']
};

const overrides: Partial<IFromQueryOptions> = {
  generateInterfaceName: name => `IGraphQL${name}`
};

const myNamespace = generateNamespace('MyGraphQL', schema, options, overrides);
fs.writeFile('mySchema.d.ts', myNamespace);
```
