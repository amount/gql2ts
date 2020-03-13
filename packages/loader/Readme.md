# @gql2ts/from-query

This package is used to load graphql files into webpack using @gql2ts/from-query. generate types/interfaces from a GraphQL Schema and a query.

## Installation

```shell
npm install @gql2ts/loader
```

## Basic Usage in webpack configuration file:

> __Note:__ It is recommended to also include [graphql-tag/loader](http://) in your webpack config, see below for an example

```javascript
import Schema from './schema';

{
// ...
  module: {
    rules: {
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'graphql-tag/loader' // Recommended
          },
          {
            loader: '@gql2ts/loader',
            options: {
              schema: Schema, // Required
              typeMap: { }, // Optional: Partial<ITypeMap> from @gql2ts/types
              options: { } // Optional: IProvidedOptions from @gql2ts/types
            }
          }
        },
      ]
    },
  }
// ...
}
