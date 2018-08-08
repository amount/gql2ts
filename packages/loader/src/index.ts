import * as fs from 'fs';
import gqlRun from '@gql2ts/from-query';
import * as loaderUtils from 'loader-utils';
import buildDeclaration from './buildDeclaration';
import { PossibleSchemaInput } from '../node_modules/@gql2ts/util';
import { ITypeMap, IProvidedOptions } from '../node_modules/@gql2ts/types';

interface IOptions {
  schema: PossibleSchemaInput;
  typeMap?: Partial<ITypeMap>;
  options?: Partial<IProvidedOptions>;
}

// tslint:disable:no-invalid-this
module.exports = function (source: string): void {
  if (this.cacheable) {
    this.cacheable();
  }

  const callback: (
    error: Error | null,
    content: string | Buffer,
  ) => void = this.async();

  const { schema, typeMap, options }: IOptions = loaderUtils.getOptions(this) as IOptions;

  if (!schema) {
    return callback(new Error('Schema must be provided'), source);
  }

  const declaration: string = gqlRun(schema, source, typeMap, options)
    .map(({ result }) => result)
    .join('\n');

  fs.writeFile(
    `${this.resourcePath}.d.ts`,
    buildDeclaration(declaration),
    err => {
      callback(err, source);
    },
  );
};
// tslint:enable:no-invalid-this
