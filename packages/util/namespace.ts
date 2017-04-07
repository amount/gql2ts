import { writeToFile } from './fileIO';

export const writeNamespaceToFile = (outputFile: string, namespace: string) => writeToFile(outputFile, namespace);
