// file I/O helpers
'use strict';
const fileIO = require('./fileIO');

const generateNamespace = (namespaceName, interfaces) => `// tslint:disable
// graphql typescript definitions

declare namespace ${namespaceName} {
${interfaces}
}

// tslint:enable
`;

const writeNamespaceToFile = (outputFile, namespace) => fileIO.writeToFile(outputFile, namespace);

module.exports = {
  writeNamespaceToFile,
  generateNamespace
}
