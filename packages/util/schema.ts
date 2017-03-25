import {
  buildSchema,
  buildClientSchema,
  IntrospectionQuery,
  GraphQLSchema,
  GraphQLType,
  GraphQLNonNull,
  GraphQLList,
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

export function isNonNullable (type: GraphQLType): type is GraphQLNonNull<any> {
  return type instanceof GraphQLNonNull;
}

export function isList (type: GraphQLType): type is GraphQLList<any> {
  return type instanceof GraphQLList;
}
