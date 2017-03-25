import * as fs from 'fs';

export const readFile: (fileName: string) => string = fileName => JSON.parse(fs.readFileSync(fileName).toString());

export const writeToFile: (fileName: string, data: string) => void =
  (fileName, data) => fs.writeFile(fileName, data, err => err && console.error('Failed to write', err) );
