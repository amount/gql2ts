# GQL2TS

```shell
npm install -g gql2ts
```

```shell
Usage: index [options] <schema.json | schema.gql> <query.gql>

Options:

  -h, --help                         output usage information
  -V, --version                      output the version number
  -o --output-file [outputFile]      name for output file, will use stdout if not specified
  -n --namespace [namespace]         name for the namespace, defaults to "GQL"
  -i --ignored-types <ignoredTypes>  names of types to ignore (comma delimited)
  -l --legacy                        Use TypeScript 1.x annotation
  -e --external-options              ES Module with method overwrites
```

## Usage Explanation

Schema can be inputted via a file or stdin and formatted as either JSON (Introspection Query result) or GraphQL Schema Language.

If a `query.gql` file is specified, `gql2ts` will run the query against the schema and generate interfaces based on that. If no query is specified, `gql2ts` will create a namespace for your schema and add the interfaces to there.

For `-e` or `--external-options`, the input should be either an ES Module with a default export or a CommonJS Module that defines a language package (default: `@gql2ts/language-typescript`) or overrides for a language. The interface for this file (`export default Partial<IFromQueryOption>`) can be found in `@gql2ts/types`.

## Examples

### With Default Options

```shell
# outputs to stdout
gql2ts schema.json
```

```shell
# outputs to file graphql.d.ts
gql2ts schema.json -o graphql.d.ts
```


### With Optional Options

```shell
gql2ts -n Avant -i BadInterface,BadType,BadUnion -o avant-gql.d.ts schema.json
```

### With stdin

```shell
cat schema.json | gql2ts
```
