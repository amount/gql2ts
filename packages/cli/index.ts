#!/usr/bin/env node
'use strict';
import * as program from 'commander';
import {
  generateNamespace,
  writeNamespaceToFile,
  readFile,
  PossibleSchemaInput
} from '@gql2ts/util';
import { schemaToInterfaces, IOptions } from '@gql2ts/from-schema';

program
  .version('1.0.0')
  .usage('[options] <schema.json>')
  .option('-o --output-file [outputFile]', 'name for output file, will use stdout if not specified')
  .option('-n --namespace [namespace]', 'name for the namespace, defaults to "GQL"', 'GQL')
  .option('-i --ignored-types <ignoredTypes>', 'names of types to ignore (comma delimited)', v => v.split(','), [])
  .option('-l --legacy', 'Use TypeScript 1.x annotation', false)
  .parse(process.argv);

const run: (schema: PossibleSchemaInput, options: Partial<IOptions>) => void = (schema, options) => {
  let interfaces: string = schemaToInterfaces(schema, options);

  let namespace: string = generateNamespace(options.namespace!, interfaces);

  if (options.outputFile) {
    writeNamespaceToFile(options.outputFile, namespace);
  } else {
    console.log(namespace);
  }
};

const fileName: string | undefined = program.args[0];

if (!process.stdin.isTTY) {
  let input: string = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (data) => {
    input += data;
  });
  process.stdin.on('end', () => run(JSON.parse(input), program));
} else if (fileName) {
  const schema: string = readFile(fileName);
  run(schema, program);
} else {
  console.error('No input specified. Please use stdin or a file name.');
}

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
