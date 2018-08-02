# @gql2ts/from-query

This package is used to load graphql files into webpack using @gql2ts/from-query. generate types/interfaces from a GraphQL Schema and a query.

## Installation

```shell
npm install @gql2ts/loader
```

## Basic Usage in webpack configuration file:

```javascript
const graphqlSchema = fs.readFileSync('./config/schema.graphql').toString();

...
  module: {
    rules: [
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        use: {
          loader: "@gql2ts/loader",
          options: {
            schema: graphqlSchema, // Required
            typeMape: { }, // Optional: Partial<ITypeMap> from @gql2ts/types
            options: { } // Optional: IProvidedOptions from @gql2ts/types
          }
        }
      },
    ]
  },
...

```
