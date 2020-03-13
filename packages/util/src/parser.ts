import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLEnumValue
} from 'graphql';

export interface IJSDocTag {
  tag: string;
  value: string | object;
}

export interface IFieldDocumentation {
  description?: string | null;
  tags: IJSDocTag[];
}

export type BuildDocumentation = (
  field:
    | GraphQLField<any, any>
    | GraphQLInputField
    | GraphQLEnumValue
    | GraphQLArgument
) => IFieldDocumentation;

type PossiblyDeprecated = GraphQLField<any, any> | GraphQLEnumValue;
function isDeprecated (field: any): field is PossiblyDeprecated {
  return !!field.isDeprecated;
}

type PossiblyDefaultValue = GraphQLInputField | GraphQLArgument;
function hasDefaultValue (field: any): field is PossiblyDefaultValue {
  return (
    {}.hasOwnProperty.call(field, 'defaultValue') &&
    field.defaultValue !== undefined
  );
}

export const getDocTags: null = null;

export const buildDocumentation: BuildDocumentation = field => {
  const tags: IJSDocTag[] = [];

  if (hasDefaultValue(field)) {
    tags.push({
      tag: 'default',
      value: field.defaultValue
    });
  }

  if (isDeprecated(field)) {
    tags.push({
      tag: 'deprecated',
      value: field.deprecationReason || ''
    });
  }

  return {
    description: field.description,
    tags,
  };
};
