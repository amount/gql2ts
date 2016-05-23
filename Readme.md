### GQL2TS

```shell
npm install -g gql2ts
```


```
Usage: index [options] <schema.json>

Options:

  -h, --help                         output usage information
  -V, --version                      output the version number
  -o --output-file [outputFile]      name for ouput file, defaults to graphqlInterfaces.d.ts
  -m --module-name [moduleName]      name for the export module, defaults to "GQL"
  -i --ignored-types <ignoredTypes>  names of types to ignore (comma delimited)
```

### Examples
```shell
gql2ts -m Avant -i BadInterface,BadType,BadUnion -o avant-gql.d.ts testSchema.json
```


### Todo
- [ ] Make an interface for a response from GraphQL, something like:

  ```typescript
  interface IGraphQLResponse {
    data: IQuery | IMutation;
    errors: Array<IGraphQLError>;
  }
  ```
  
- [ ] Add a comprehensive test suite
