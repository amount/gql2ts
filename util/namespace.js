// file I/O helpers
'use strict';
const fileIO = require('./fileIO');

const generateNamespace = (namespaceName, interfaces) => `// graphql typescript definitions
/* tslint:disable */

declare namespace ${namespaceName} {
${interfaces}
}
/* tslint:enable */
`;

const writeNamespaceToFile = (outputFile, namespace) => fileIO.writeToFile(outputFile, namespace);

module.exports = {
  writeNamespaceToFile,
  generateNamespace
}
