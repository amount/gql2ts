import { writeToFile } from './fileIO';

export const generateNamespace: (namespaceName: string, interfaces: string) => string = (namespaceName, interfaces) => `// tslint:disable
// graphql typescript definitions

declare namespace ${namespaceName} {
${interfaces}
}

// tslint:enable
`;

export const writeNamespaceToFile = (outputFile: string, namespace: string) => writeToFile(outputFile, namespace);
