import {
  generateInterfaceName,
  generateTypeName,
  generateEnumName,
} from './nameGenerators';
import {
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLField,
  GraphQLObjectType,
  GraphQLInputFieldMap,
  GraphQLFieldMap,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLType,
  isAbstractType,
  GraphQLOutputType,
} from 'graphql';
import {
  schemaFromInputs,
  PossibleSchemaInput,
  isEnum,
  isList,
  isNonNullable,
} from '@gql2ts/util';

const generateRootDataName: (schema: GraphQLSchema) => string = schema => {
  let rootNamespaces: string[] = [];

  if (schema.getQueryType()) {
    rootNamespaces.push(generateInterfaceName(schema.getQueryType().name));
  }

  if (schema.getMutationType()) {
    rootNamespaces.push(generateInterfaceName(schema.getMutationType().name));
  }

  if (schema.getSubscriptionType()) {
    rootNamespaces.push(generateInterfaceName(schema.getSubscriptionType().name));
  }

  return rootNamespaces.join(' | ');
};

const generateRootTypes: (schema: GraphQLSchema) => string = schema => `  interface IGraphQLResponseRoot {
    data?: ${generateRootDataName(schema)};
    errors?: Array<IGraphQLResponseError>;
  }

  interface IGraphQLResponseError {
    message: string;            // Required for all errors
    locations?: Array<IGraphQLResponseErrorLocation>;
    [propName: string]: any;    // 7.2.2 says 'GraphQL servers may provide additional entries to error'
  }

  interface IGraphQLResponseErrorLocation {
    line: number;
    column: number;
  }`;

const generateTypeDeclaration: (description: string, name: string, possibleTypes: string) => string =
(description, name, possibleTypes) => `  /*
    description: ${description}
  */
  type ${name} = ${possibleTypes};

`;

const typeNameDeclaration: string = '    __typename: string;\n';

type GenerateInterfaceDeclaration =
  (description: string, declaration: string, fields: string, additionalInfo: string, isInput: boolean) => string;

const generateInterfaceDeclaration: GenerateInterfaceDeclaration =
(description, declaration, fields, additionalInfo, isInput) => `${additionalInfo}  /*
    description: ${description}
  */
  interface ${declaration} {
${isInput ? '' : typeNameDeclaration}${fields}
  }`;

type GenerateEnumDeclaration = (description: string, name: string, enumValues: string[]) => string;

const generateEnumDeclaration: GenerateEnumDeclaration = (description, name, enumValues) => `  /*
    description: ${description}
  */
  type ${generateEnumName(name)} = ${enumValues.join(' | ')};`;

/**
 * TODO
 * - add support for custom types (via optional json file or something)
 * - allow this to return metadata for Non Null types
 */
const resolveInterfaceName: (type: GraphQLInputType | GraphQLType) => string = type => {
  if (isList(type)) {
    return `Array<${resolveInterfaceName((type).ofType)}>`;
  } else if (isNonNullable(type)) {
    return `!${resolveInterfaceName((type).ofType)}`;
  } else if (type instanceof GraphQLScalarType) {
    switch (type.name) {
      case 'ID':
      case 'String':
        return 'string';

      case 'Boolean':
        return 'boolean';

      case 'Float':
      case 'Int':
        return 'number';

      default:
        return 'any';
    }
  } else if (type instanceof GraphQLInterfaceType) {
    return generateTypeName(type.name);
  } else if (isEnum(type)) {
    return generateEnumName(type.name);
  } else {
    return generateInterfaceName(type.name);
  }
};
type FieldToDefinition = (field: GraphQLField<any, any> | GraphQLInputField, isInput: boolean, supportsNullability: boolean) => string;
const fieldToDefinition: FieldToDefinition = (field, isInput, supportsNullability) => {
  let interfaceName: string = resolveInterfaceName(field.type);
  let fieldDef: string;
  let isNotNull: boolean = interfaceName.includes('!');
  let showNullabiltyAttribute: boolean = !isNotNull && supportsNullability;

  if (isNotNull) {
    /**
     * should probably refactor this at some point to have
     * `resolveInterfaceName` return better metadata
     * global regex replace is ugly
     */
    interfaceName = interfaceName.replace(/\!/g, '');
  }
  fieldDef = field.name;
  if (isInput) {
    let isUndef: boolean = showNullabiltyAttribute || !isNotNull;
    if (isUndef) {
      fieldDef += '?';
    }
  }

  fieldDef += `: ${interfaceName}`;

  if (showNullabiltyAttribute) {
    fieldDef += showNullabiltyAttribute ? ' | null' : '';
  }

  return `    ${fieldDef};`;
};

const findRootType: (type: GraphQLOutputType | GraphQLInputType) => GraphQLNamedType = type => {
  if (isList(type) || isNonNullable(type)) {
    return findRootType(type.ofType);
  }

  return type;
};

const filterField: (field: GraphQLField<any, any> | GraphQLInputField, ignoredTypes: Set<String>) => boolean = (field, ignoredTypes) => {
  let nestedType: GraphQLNamedType = findRootType(field.type);
  return !ignoredTypes.has(nestedType.name);
};

type TypeToInterface = (
  type: GraphQLNamedType,
  ignoredTypes: Set<string>,
  supportsNullability: boolean,
  interfaceMap: Map<GraphQLInterfaceType, GraphQLObjectType[]>
) => string | null;

const typeToInterface: TypeToInterface = (type, ignoredTypes, supportsNullability, interfaceMap) => {
  if (type instanceof GraphQLScalarType) {
    return null;
  }

  if (isEnum(type)) {
    return generateEnumDeclaration(type.description, type.name, type.getValues().map(v => `"${v.name}"`));
  }

  let isInput: boolean = type instanceof GraphQLInputObjectType;
  const f1: GraphQLInputFieldMap | GraphQLFieldMap<any, any> =
    (type instanceof GraphQLInputObjectType) ? type.getFields() : ((type as GraphQLObjectType).getFields)();
  let f: Array<GraphQLField<any, any> | GraphQLInputField> = Object.keys(f1).map(k => f1[k]);
  f = f || [];

  let fields: string = f
                .filter(field => filterField(field, ignoredTypes))
                .map(field => fieldToDefinition(field, isInput, supportsNullability))
                .filter(field => field)
                .join('\n');

  let interfaceDeclaration: string = generateInterfaceName(type.name);
  let additionalInfo: string = '';

  if (isAbstractType(type)) {
    const poss: Array<GraphQLObjectType | GraphQLField<any, any>> =
      (type instanceof GraphQLInterfaceType) ? (interfaceMap.get(type) || []) : type.getTypes();
    let possibleTypes: string[] = poss
                          .filter(t => !ignoredTypes.has(t.name))
                          .map(t => generateInterfaceName(t.name));

    if (possibleTypes.length) {
      additionalInfo = generateTypeDeclaration(type.description, generateTypeName(type.name), possibleTypes.join(' | '));
    }
  }

  return generateInterfaceDeclaration(type.description, interfaceDeclaration, fields, additionalInfo, isInput);
};

const typesToInterfaces: (schema: GraphQLSchema, options: Partial<IOptions>) => string = (schema, options) => {
  const ignoredTypes: Set<string> = new Set(options.ignoredTypes);
  const interfaces: string[] = [];
  interfaces.push(generateRootTypes(schema));       // add root entry point & errors
  const supportsNullability: boolean = !options.legacy;
  const types: GraphQLNamedType = schema.getTypeMap();
  const typeArr: GraphQLNamedType[] = Object.keys(types).map(k => types[k]);
  const interfaceMap: Map<GraphQLInterfaceType, GraphQLObjectType[]> = new Map();
  typeArr.forEach(type => {
    if (type instanceof GraphQLObjectType) {
      type.getInterfaces().forEach(iface => {
        if (interfaceMap.has(iface)) {
          interfaceMap.set(iface, [...(interfaceMap.get(iface)!), type]);
        } else {
          interfaceMap.set(iface, [ type ]);
        }
      });
    }
  });

  const typeInterfaces: string[] =
    typeArr
      .filter(type => !type.name.startsWith('__'))  // remove introspection types
      .filter(type =>                               // remove ignored types
        !ignoredTypes.has(type.name)
      )
      .map(type =>                                  // convert to interface
        typeToInterface(type, ignoredTypes, supportsNullability, interfaceMap)!
      )
      .filter(type => type);                        // remove empty ones

  return interfaces
          .concat(typeInterfaces)                   // add typeInterfaces to return object
          .join('\n\n');                            // add newlines between interfaces
};

export const schemaToInterfaces: (schema: PossibleSchemaInput, options: Partial<IOptions>) => string =
  (schema, options) => typesToInterfaces(schemaFromInputs(schema), options);

export interface IOptions {
  legacy?: boolean;
  ignoredTypes: string[];
  namespace: string;
  outputFile?: string;
  externalOptions?: string;
}
