import * as fs from 'fs';

export const badWriteHandler: (err?: Error) => void = err => { if (err) { throw err; } };
export const readFile: (fileName: string) => string | object = fileName => {
  const stringifiedFile: string = fs.readFileSync(fileName).toString();
  if (fileName.endsWith('.json')) {
    // force JSON Parse
    return JSON.parse(stringifiedFile);
  } else if (fileName.endsWith('.graphql') || fileName.endsWith('.gql')) {
    // assume graphql schema language
    return stringifiedFile;
  } else {
    // fallback when the type is unknown
    return safeJSONParse(stringifiedFile);
  }
};

export const safeJSONParse: (possibleJSON: string) => string | object = possibleJson => {
  try {
    return JSON.parse(possibleJson);
  } catch (e) {
    return possibleJson;
  }
};

export const writeToFile: (fileName: string, data: string) => void =
  (fileName, data) => fs.writeFile(fileName, data, badWriteHandler);
