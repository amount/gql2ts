#!/usr/bin/env node
'use strict';
const program = require('commander');

// file I/O helpers
const fileIO = require('./util/fileIO');

// Interface Utils
const interfaceUtils = require('./util/interface');

// Namespace Utils
const namespaceUtils = require('./util/namespace')

program
  .version('0.6.0')
  .usage('[options] <schema.json>')
  .option('-o --output-file [outputFile]', 'name for output file, will use stdout if not specified')
  .option('-n --namespace [namespace]', 'name for the namespace, defaults to "GQL"', 'GQL')
  .option('-i --ignored-types <ignoredTypes>', 'names of types to ignore (comma delimited)', v => v.split(','), [])
  .option('-l --legacy', 'Use TypeScript 1.x annotation', false)
  .parse(process.argv);

const run = (schema, options) => {
  let interfaces = interfaceUtils.schemaToInterfaces(schema, options);

  let namespace = namespaceUtils.generateNamespace(options.namespace, interfaces);

  if (options.outputFile) {
    namespaceUtils.writeNamespaceToFile(options.outputFile, namespace);
  } else {
    console.log(namespace);
  }
}

const fileName = program.args[0];

if (!process.stdin.isTTY) {
  let input = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (data) => {
    input += data;
  });
  process.stdin.on('end', () => run(JSON.parse(input), program))
} else if (fileName) {
  const schema = fileIO.readFile(fileName);
  run(schema, program);
} else {
  console.error('No input specified. Please use stdin or a file name.');
}

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
