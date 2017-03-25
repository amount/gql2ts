import {
  buildSchema,
  buildClientSchema,
  IntrospectionQuery,
  GraphQLSchema,
} from 'graphql';

export type PossibleIntrospectionInputs = { data: IntrospectionQuery } | IntrospectionQuery;
export type PossibleSchemaInput = GraphQLSchema | string | PossibleIntrospectionInputs;

export function isIntrospectionResult (schema: PossibleIntrospectionInputs): schema is IntrospectionQuery {
  return ('__schema' in schema);
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
