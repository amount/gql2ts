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
  GraphQLEnumValue,
  GraphQLUnionType,
  GraphQLAbstractType,
} from 'graphql';
import {
  schemaFromInputs,
  PossibleSchemaInput,
  isEnum,
  isList,
  isNonNullable,
} from '@gql2ts/util';
import { IFromQueryOptions, ITypeMap } from '@gql2ts/types';
import { DEFAULT_OPTIONS, DEFAULT_TYPE_MAP } from '@gql2ts/language-typescript';

const run: (schemaInput: GraphQLSchema, optionsInput: IInternalOptions) => string = (schemaInput, optionsInput) => {
  const {
    generateEnumName,
    generateInterfaceName,
    generateTypeName,
    printType,
    formatInput,
    wrapList,
    formatEnum,
    typeBuilder,
    generateInterfaceDeclaration: gID,
    interfaceBuilder,
    addSemicolon,
  } = optionsInput.formats;

  const TYPE_MAP: ITypeMap = { ...DEFAULT_TYPE_MAP, ...(optionsInput.typeMap || {}) };

  function isScalar (type: any): type is GraphQLScalarType {
    return type instanceof GraphQLScalarType || !!(type as any)._scalarConfig;
  }

  const generateRootDataName: (schema: GraphQLSchema) => string = schema => {
    let rootNamespaces: string[] = [];
    const queryType: GraphQLObjectType = schema.getQueryType();
    const mutationType: GraphQLObjectType | undefined | null = schema.getMutationType();
    const subscriptionType: GraphQLObjectType | undefined | null = schema.getSubscriptionType();

    if (queryType) {
      rootNamespaces.push(generateInterfaceName(queryType.name));
    }

    if (mutationType) {
      rootNamespaces.push(generateInterfaceName(mutationType.name));
    }

    if (subscriptionType) {
      rootNamespaces.push(generateInterfaceName(subscriptionType.name));
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
  type GenerateDescription = (description?: string, jsDoc?: IJSDocTag[]) => string;
  const generateDescription: GenerateDescription = (description, jsDoc = []) => (description || jsDoc.length) ? `/**
    ${[description, ...jsDoc.map(({ tag, value }) => `@${tag} ${value}`)].filter(x => !!x).join('\n')}
  */` : '';

  const wrapWithDescription: (declaration: string, description: string) => string = (declaration, description) =>
  `  ${generateDescription(description)}
  ${declaration}`;

  interface IJSDocTag {
    tag: string;
    value: string;
  }

  function isInputField (field: GraphQLField<any, any> | GraphQLInputField): field is GraphQLInputField {
    return !!field.astNode && field.astNode.kind === 'InputValueDefinition';
  }

  const buildDocTags: (field: GraphQLField<any, any> | GraphQLInputField) => IJSDocTag[] = field => {
    const tags: IJSDocTag[] = [];
    if (!field.astNode) {
      return tags;
    } else if (isInputField(field)) {
      if (field.defaultValue) {
        tags.push({ tag: 'default', value: field.defaultValue });
      }
    } else {
      if (field.isDeprecated) {
        tags.push({ tag: 'deprecated', value: field.deprecationReason || '' });
      }
    }

    return tags;
  };

  const generateTypeDeclaration: (description: string, name: string, possibleTypes: string) => string =
    (description, name, possibleTypes) => wrapWithDescription(addSemicolon(typeBuilder(name, possibleTypes)) + '\n\n', description);

  const typeNameDeclaration: (name: string) => string = name => addSemicolon(`__typename: "${name}"`);

  type GenerateInterfaceDeclaration =
    (type: GraphQLNamedType, declaration: string, fields: string[], additionalInfo: string, isInput: boolean) => string;

  const generateInterfaceDeclaration: GenerateInterfaceDeclaration =
    ({ name, description }, declaration, fields, additionalInfo, isInput) => {
      if (!isInput && !optionsInput.ignoreTypeNameDeclaration) {
       fields =  [typeNameDeclaration(name), ...fields];
      }
      return additionalInfo + wrapWithDescription(interfaceBuilder(declaration, gID(fields.map(f => `    ${f}`), '  ')), description);
    };

  type GenerateEnumDeclaration = (description: string, name: string, enumValues: GraphQLEnumValue[]) => string;
  const generateEnumDeclaration: GenerateEnumDeclaration = (description, name, enumValues) =>
    wrapWithDescription(typeBuilder(generateEnumName(name), addSemicolon(formatEnum(enumValues))), description);

  /**
   * TODO
   * - add support for custom types (via optional json file or something)
   * - allow this to return metadata for Non Null types
   */
  const resolveInterfaceName: (type: GraphQLInputType | GraphQLType) => string = type => {
    if (isList(type)) {
      return wrapList(resolveInterfaceName((type).ofType));
    } else if (isNonNullable(type)) {
      return `!${resolveInterfaceName((type).ofType)}`;
    } else if (isScalar(type)) {
      return TYPE_MAP[type.name] || TYPE_MAP.__DEFAULT;
    } else if (isAbstractType(type)) {
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

    return formatInput(
      field.name,
      isInput && (showNullabiltyAttribute || !isNotNull),
      printType(interfaceName, !showNullabiltyAttribute)
    );
  };

  const findRootType: (type: GraphQLOutputType | GraphQLInputType) => GraphQLNamedType = type => {
    if (isList(type) || isNonNullable(type)) {
      return findRootType(type.ofType);
    }

    return type;
  };

  const filterField: (field: GraphQLField<any, any> | GraphQLInputField, ignoredTypes: Set<String>) => boolean = (field, ignoredTypes) => {
    let nestedType: GraphQLNamedType = findRootType(field.type);
    return !ignoredTypes.has(nestedType.name) && (!optionsInput.excludeDeprecatedFields || !(field as GraphQLField<any, any>).isDeprecated);
  };

  type InterfaceMap = Map<GraphQLInterfaceType, GraphQLObjectType[]>;

  type TypeToInterface = (
    type: GraphQLNamedType,
    ignoredTypes: Set<string>,
    supportsNullability: boolean,
    interfaceMap: InterfaceMap
  ) => string | null;

  function isUnion (type: GraphQLNamedType): type is GraphQLUnionType {
    return type instanceof GraphQLUnionType;
  }

  type GenerateAbstractTypeDeclaration = (type: GraphQLAbstractType, ignoredTypes: Set<string>, interfaceMap: InterfaceMap) => string;

  const generateAbstractTypeDeclaration: GenerateAbstractTypeDeclaration = (type, ignoredTypes, interfaceMap) => {
    const poss: Array<GraphQLObjectType | GraphQLField<any, any>> = (isUnion(type)) ? type.getTypes() : interfaceMap.get(type) || [];
    let possibleTypes: string[] = poss
      .filter(t => !ignoredTypes.has(t.name))
      .map(t => generateInterfaceName(t.name));

    return generateTypeDeclaration(type.description, generateTypeName(type.name), possibleTypes.join(' | '));
  };

  const typeToInterface: TypeToInterface = (type, ignoredTypes, supportsNullability, interfaceMap) => {
    if (isScalar(type)) {
      return null;
    }

    if (isUnion(type)) {
      return generateAbstractTypeDeclaration(type, ignoredTypes, interfaceMap);
    }

    if (isEnum(type)) {
      return generateEnumDeclaration(type.description, type.name, type.getValues());
    }

    let isInput: boolean = type instanceof GraphQLInputObjectType;
    const f1: GraphQLInputFieldMap | GraphQLFieldMap<any, any> = type.getFields();
    let f: Array<GraphQLField<any, any> | GraphQLInputField> = Object.keys(f1).map(k => f1[k]);

    let fields: string[] = f
      .filter(field => filterField(field, ignoredTypes))
      .map(field => [generateDescription(field.description, buildDocTags(field)), fieldToDefinition(field, isInput, supportsNullability)])
      .reduce((acc, val) => [...acc, ...val.filter(x => x)] , [])
      .filter(field => field);

    let interfaceDeclaration: string = generateInterfaceName(type.name);
    let additionalInfo: string = '';

    if (isAbstractType(type)) {
      additionalInfo = generateAbstractTypeDeclaration(type, ignoredTypes, interfaceMap);
    }

    return generateInterfaceDeclaration(type, interfaceDeclaration, fields, additionalInfo, isInput);
  };

  const typesToInterfaces: (schema: GraphQLSchema, options: Partial<IInternalOptions>) => string = (schema, options) => {
    const ignoredTypes: Set<string> = new Set(options.ignoredTypes);
    const interfaces: string[] = [];
    interfaces.push(generateRootTypes(schema));       // add root entry point & errors
    const supportsNullability: boolean = !options.legacy;
    const types: { [typeName: string]: GraphQLNamedType } = schema.getTypeMap();
    const typeArr: GraphQLNamedType[] = Object.keys(types).map(k => types[k]);
    const interfaceMap: Map<GraphQLInterfaceType, GraphQLObjectType[]> = new Map();
    typeArr.forEach(type => {
      if (type instanceof GraphQLObjectType) {
        type.getInterfaces().forEach(iface => {
          if (interfaceMap.has(iface)) {
            interfaceMap.set(iface, [...(interfaceMap.get(iface)!), type]);
          } else {
            interfaceMap.set(iface, [type]);
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

  return typesToInterfaces(schemaInput, optionsInput);
};

export type SchemaToInterfaces =
  (
    schema: PossibleSchemaInput,
    options?: Partial<ISchemaToInterfaceOptions>,
    formatters?: Partial<IFromQueryOptions>
  ) => string;
export const schemaToInterfaces: SchemaToInterfaces = (schema, options = {}, formatters = {}) => run(
  schemaFromInputs(schema),
  {
    ...options,
    formats: {
      ...DEFAULT_OPTIONS,
      ...formatters
    }
  }
);

export type GenerateNamespace =
  (
    namespace: string,
    schema: PossibleSchemaInput,
    options?: Partial<ISchemaToInterfaceOptions>,
    overrides?: Partial<IFromQueryOptions>
  ) => string;

export const generateNamespace: GenerateNamespace = (namespace, schema, options = {}, overrides = {}) => {
  const formatters: IFromQueryOptions = { ...DEFAULT_OPTIONS, ...overrides };
  return formatters.postProcessor(formatters.generateNamespace(namespace, schemaToInterfaces(schema, options, formatters)));
};

export interface ISchemaToInterfaceOptions {
  legacy?: boolean;
  ignoredTypes: string[];
  ignoreTypeNameDeclaration?: boolean;
  namespace: string;
  outputFile?: string;
  externalOptions?: string;
  typeMap?: ITypeMap;
  excludeDeprecatedFields?: boolean;
}

export interface IInternalOptions extends Partial<ISchemaToInterfaceOptions> {
  formats: IFromQueryOptions;
}
