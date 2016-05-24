#!/usr/bin/env node
'use strict';
const program = require('commander');

// file I/O helpers
const fileIO = require('./util/fileIO');

// Interface Utils
const interfaceUtils = require('./util/interface');

// Module Utils
const moduleUtils = require('./util/module')

program
  .version('0.0.2')
  .usage('[options] <schema.json>')
  .option('-o --output-file [outputFile]', 'name for ouput file, defaults to graphqlInterfaces.d.ts', 'graphqlInterfaces.d.ts')
  .option('-m --module-name [moduleName]', 'name for the export module, defaults to "GQL"', 'GQL')
  .option('-i --ignored-types <ignoredTypes>', 'names of types to ignore (comma delimited)', v => v.split(','), [])
  .action((fileName, options) => {
    let schema = fileIO.readFile(fileName);
    let types = schema.data.__schema.types;

    let interfaces = types
                      .filter(type => !type.name.startsWith('__'))  // remove introspection types
                      .filter(type =>                               // remove ignored types
                        !options.ignoredTypes.includes(type.name)
                      )
                      .map(type =>                                  // convert to interface
                        interfaceUtils.typeToInterface(type, options.ignoredTypes)
                      )
                      .filter(type => type)                         // remove empty ones
                      .join('\n\n');                                // put whitespace between them

    let module = moduleUtils.generateModule(options.moduleName, interfaces);

    moduleUtils.writeModuleToFile(options.outputFile, module);
  })
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
