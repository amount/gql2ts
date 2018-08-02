import gql from 'graphql-tag';
import * as fs from 'fs';
import gqlRun from '@gql2ts/from-query';
import { ITypeMap, IProvidedOptions } from '@gql2ts/types';
import * as loaderUtils from 'loader-utils';

const DeclarationContent: string = `/* this is an auto-generated file. do not modify. */

import { DocumentNode } from 'graphql';

declare let GraphQLQuery: DocumentNode;

export default GraphQLQuery;
`;

const FileContent: any = (
  schema: any,
  source: string,
  typeMap?: Partial<ITypeMap> | undefined,
  options?: IProvidedOptions | undefined,
): string => `
// tslint:disable

${DeclarationContent}

${gqlRun(schema, source, typeMap, options)
  .map(({ result }) => result)
  .join('\n')}
`;

// tslint:disable:no-invalid-this
// tslint:disable-next-line:typedef
module.exports = function (source: any) {
  const options: loaderUtils.OptionObject = loaderUtils.getOptions(this);

  if (!options.schema) {
    throw new Error('options[\'schema\'] must be set for graphql-loader');
  }

  fs.writeFileSync(`${this.resourcePath}.d.ts`, FileContent(options.schema, source, options.typeMap, options.options));
  return `export default ${JSON.stringify(gql(source))};`;
};
// tslint:enable:no-invalid-this
