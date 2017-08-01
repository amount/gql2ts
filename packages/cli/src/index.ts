#!/usr/bin/env node
'use strict';
import * as program from 'commander';
import * as fs from 'fs';
import {
  readFile,
  writeToFile,
  PossibleSchemaInput,
} from '@gql2ts/util';
import { ISchemaToInterfaceOptions, generateNamespace } from '@gql2ts/from-schema';
import fromQuery from '@gql2ts/from-query';
import { IFromQueryReturnValue } from '@gql2ts/types';
const { version } = require('../package.json');

program
  .version(version)
  .usage('[options] <schema.json> <query.gql>')
  .option('-o --output-file [outputFile]', 'name for output file, will use stdout if not specified')
  .option('-n --namespace [namespace]', 'name for the namespace, defaults to "GQL"', 'GQL')
  .option('-i --ignored-types <ignoredTypes>', 'names of types to ignore (comma delimited)', v => v.split(','), [])
  .option('-l --legacy', 'Use TypeScript 1.x annotation', false)
  .option('-e --external-options [externalOptions]', 'ES Module with method overwrites')
  .option('--ignore-type-name-declaration', 'Whether to exclude __typename', false)
  .parse(process.argv);

interface ICLIOptions extends Partial<ISchemaToInterfaceOptions> {
  queryString: string;
}

const run: (schema: PossibleSchemaInput, options: Partial<ICLIOptions>) => void = (schema, options) => {
  let defaultOverrides: object = {};
  if (program.externalOptions) {
    // tslint:disable-next-line no-require-imports no-var-requires
    defaultOverrides = require(program.externalOptions);
  }

  if (program.args[1]) {
    const queryFile: string = program.args[1];
    const query: string = fs.readFileSync(queryFile).toString();
    const info: IFromQueryReturnValue[] = fromQuery(schema, query, {}, defaultOverrides);
    const toWrite: string = info.map(inf => inf.result).join('\n\n');
    if (options.outputFile) {
      writeToFile(options.outputFile, toWrite);
    } else {
      console.log(toWrite);
    }
    return;
  }

  let namespace: string = generateNamespace(options.namespace!, schema, options, defaultOverrides);

  if (options.outputFile) {
    writeToFile(options.outputFile, namespace);
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
  process.stdin.on('end', () => run(JSON.parse(input), program as any));
} else if (fileName) {
  const schema: string = readFile(fileName);
  run(schema, program as any);
} else {
  console.error('No input specified. Please use stdin or a file name.');
  program.outputHelp();
}
