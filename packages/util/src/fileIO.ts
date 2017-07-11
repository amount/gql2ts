import * as fs from 'fs';
import * as glob from 'glob';
import { mergeTypes } from 'merge-graphql-schemas';

export const badWriteHandler: (err?: Error) => void = err => { if (err) { throw err; } };
export const readFile: (fileName: string) => string = fileName => {
  const isGqlFile: boolean = ['gql', 'graphql'].some(ext => fileName.includes(ext));
  if (isGqlFile) {
      const globbedFilePaths: string[] = glob.sync(fileName);
      const content: string[] = globbedFilePaths.map((filePath: string) => fs.readFileSync(filePath).toString());
      return mergeTypes(content);
  }
  return JSON.parse(fs.readFileSync(fileName).toString());
};
export const writeToFile: (fileName: string, data: string) => void =
  (fileName, data) => fs.writeFile(fileName, data, badWriteHandler);
