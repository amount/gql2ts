// file I/O helpers
'use strict';
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
  fileIO.writeToFile(outputFile, module);
}

module.exports = {
  writeModuleToFile,
  generateModule
}
