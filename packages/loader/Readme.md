# @gql2ts/from-query

This package is used to load graphql files into webpack using @gql2ts/from-query. generate types/interfaces from a GraphQL Schema and a query.

## Installation

```shell
npm install @gql2ts/loader
```

## Basic Usage in webpack configuration file:

It is recommended to include the [graphql-tag/loader](https://github.com/apollographql/graphql-tag#webpack-preprocessing-with-graphql-tagloader) in the `use` array.

```javascript
import Schema from './schema';

...
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
...

```
