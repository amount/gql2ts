// file I/O helpers

const fileIO = require('./fileIO');

const generateModule = (moduleName, interfaces) => {
  return `// graphql typescript definitions

declare module ${moduleName} {
${interfaces}
}

export default ${moduleName};
`
};

const writeModuleToFile = (outputFile, module) => {
  ouputFile = outputFile;

  fileIO.writeToFile(ouputFile, module);
}

module.exports = {
  writeModuleToFile,
  generateModule
}
