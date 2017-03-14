# GQL2TS

[![Build Status](https://travis-ci.org/avantcredit/gql2ts.svg?branch=refactor_with_tests)](https://travis-ci.org/avantcredit/gql2ts)

```shell
npm install -g gql2ts
```

```shell
Usage: index [options] <schema.json>

Options:

  -h, --help                         output usage information
  -V, --version                      output the version number
  -o --output-file [outputFile]      name for output file
  -n --namespace [namespace]         name for the namespace, defaults to "GQL"
  -i --ignored-types <ignoredTypes>  names of types to ignore (comma delimited)
  -l --legacy                        Use TypeScript 1.x annotation
  -s --stdin                         Accept stdin
```

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
cat schema.json | gql2ts -s
```
