const buildDeclaration: (declaration: string) => string = declaration => `// tslint:disable
/* eslint-disable */
/* this is an auto-generated file. do not modify. */

import { DocumentNode } from 'graphql';

declare let GraphQLQuery: DocumentNode;

export default GraphQLQuery;

${declaration}
`;

export default buildDeclaration;
