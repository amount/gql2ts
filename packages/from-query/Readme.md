# @gql2ts/from-query

## Basic Usage

```ts
import fromQuery from '@gql2ts/from-query';
import { schema, query } from 'my-graphql-stuff';
import * as fs from 'fs';

// { variables: string; interface: string; additionalTypes: string[] }[]
const typescriptDefinitions = fromQuery(schema, query);

const allDefinitions = typescriptDefinitions.map(({ variables, interface, additionalTypes }) => [variables, interface, additionalTypes].join('\n')).join('\n');

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

// { variables: string; interface: string; additionalTypes: string[] }[]
const typescriptDefinitions = fromQuery(schema, query, myCustomTypes, options);

const allDefinitions = typescriptDefinitions.map(({ variables, interface, additionalTypes }) => [variables, interface, additionalTypes].join('\n')).join('\n');

fs.writeFile('definition.d.ts', allDefinitions);
```
