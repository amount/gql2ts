import {
  buildSchema,
  buildClientSchema,
  IntrospectionQuery,
  GraphQLSchema,
  GraphQLType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLEnumType,
} from 'graphql';
import * as glob from 'glob';
import * as fs from 'fs';
import { mergeTypes } from 'merge-graphql-schemas';

export type PossibleIntrospectionInputs = { data: IntrospectionQuery } | IntrospectionQuery;
export type PossibleSchemaInput = GraphQLSchema | string | PossibleIntrospectionInputs;

export function isIntrospectionResult (schema: PossibleIntrospectionInputs): schema is IntrospectionQuery {
  return ('__schema' in (schema || {}));
}

export const schemaFromInputs: (schema: PossibleSchemaInput) => GraphQLSchema = schema => {
  if (schema instanceof GraphQLSchema) {
    return schema;
  } else if (typeof schema === 'string') {
    return buildSchema(schema);
  } else if (isIntrospectionResult(schema)) {
    return buildClientSchema(schema);
  } else if (isIntrospectionResult(schema.data)) {
    return buildClientSchema(schema.data);
  } else {
    throw new Error('Invalid Schema Input');
  }
};

export function isNonNullable (type: GraphQLType): type is GraphQLNonNull<any> {
  return type instanceof GraphQLNonNull;
}

export function isList (type: GraphQLType): type is GraphQLList<any> {
  return type instanceof GraphQLList;
}

export function isEnum (type: GraphQLType): type is GraphQLEnumType {
  return type instanceof GraphQLEnumType;
}

export const gqlGlobHandler: (pattern: string) => string = (pattern) => {
  const files: string[] = glob.sync(pattern);
  const content: string[] = files.map((fileName: string) => fs.readFileSync(fileName).toString());
  const schema: string  = mergeTypes(content).join('');
  return schema;
};
