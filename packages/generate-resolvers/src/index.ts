import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldMap,
  GraphQLField,
} from 'graphql';

import {
  schemaFromInputs,
  PossibleSchemaInput,
} from '@gql2ts/util';
// import { IFromQueryOptions } from '@gql2ts/types';
// import { DEFAULT_OPTIONS } from '@gql2ts/language-typescript';

/**
 *  interface IQuery {
 *    getUser (id: string): IUser | Promise<IUser>;
 *    getString (id: string): string;
 *  }
 */

const testSchema: string = `
  type Query {
    getString(id: ID!): String!
    getUser(id: ID!): User
  }

  type User {
    id: ID!
  }

  type Schema {
    query: Query
  }
`;

interface IArgument {
  name: string;
  type: string;
}

const argsToString: (args: IArgument[]) => string = args => (
  ['{', ...args.map(({name, type}) => `${name}: ${type};`), '}'].join(' ')
);

const run: (schema: GraphQLSchema) => string = schema => {
  // const { printType }: IFromQueryOptions = DEFAULT_OPTIONS;

  const queryType: GraphQLObjectType = schema.getQueryType();
  const fields: GraphQLFieldMap<any, any> = queryType.getFields();
  Object.keys(fields).map(key => {
    const field: GraphQLField<any, any> = fields[key];
    const { args, type }: typeof field = field;
    const argsMap: any[] = args.map(({ name, type: argType }) => ({ name, type: argType }));
    console.log(`${key} (source: any, args: ${argsToString(argsMap)}, ctx: any): ${type};`);
  });

  return '';
};

export const generateResolvers: (schema: PossibleSchemaInput) => string = schema => run(schemaFromInputs(schema));

console.log(generateResolvers(testSchema));
