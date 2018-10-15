import {
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLInputObjectType,
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
  GraphQLAbstractType,
  GraphQLArgument,
} from 'graphql';
import {
  schemaFromInputs,
  PossibleSchemaInput,
  isEnum,
  isList,
  isNonNullable,
  buildDocumentation,
  IFieldDocumentation,
  filterAndJoinArray,
  isUnion,
  isScalar
} from '@gql2ts/util';
import { IFromQueryOptions, ITypeMap } from '@gql2ts/types';
import { DEFAULT_OPTIONS, DEFAULT_TYPE_MAP } from '@gql2ts/language-typescript';
import * as dedent from 'dedent';

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
    enumTypeBuilder,
    generateDocumentation,
    typeMap
  } = optionsInput.formats;

  const TYPE_MAP: ITypeMap = {
    ...DEFAULT_TYPE_MAP,
    ...(typeMap || {}),
    ...(optionsInput.typeMap || {})
  };

  const generateRootDataName: (schema: GraphQLSchema) => string = schema => {
    let rootNamespaces: string[] = [];
    const queryType: GraphQLObjectType | undefined | null = schema.getQueryType();
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

    return filterAndJoinArray(rootNamespaces, ' | ');
  };

  const generateRootTypes: (schema: GraphQLSchema) => string = schema => filterAndJoinArray(
    [
      interfaceBuilder(
        generateInterfaceName('GraphQLResponseRoot'),
        gID([
          formatInput('data', !optionsInput.legacy, generateRootDataName(schema)),
          formatInput('errors', !optionsInput.legacy, wrapList(generateInterfaceName('GraphQLResponseError')))
        ])
      ),
      interfaceBuilder(
        generateInterfaceName('GraphQLResponseError'),
        gID([
          '/** Required for all errors */',
          formatInput('message', false, TYPE_MAP.String),
          formatInput('locations', !optionsInput.legacy, wrapList(generateInterfaceName('GraphQLResponseErrorLocation'))),
          `/** 7.2.2 says 'GraphQL servers may provide additional entries to error' */`,
          formatInput('[propName: string]', false, TYPE_MAP.__DEFAULT),
        ])
      ),
      interfaceBuilder(
        generateInterfaceName('GraphQLResponseErrorLocation'),
        gID([
          formatInput('line', false, TYPE_MAP.Int),
          formatInput('column', false, TYPE_MAP.Int),
        ])
      )
    ],
    '\n\n'
  );

  const wrapWithDocumentation: (declaration: string, documentation: IFieldDocumentation) => string = (declaration, documentation) => dedent`
    ${generateDocumentation(documentation)}
    ${declaration}
  `;

  function isInputField (field: GraphQLField<any, any> | GraphQLInputField): field is GraphQLInputField {
    return (!!field.astNode && field.astNode.kind === 'InputValueDefinition') || !({}).hasOwnProperty.call(field, 'args');
  }

  const generateTypeDeclaration: (description: string | null | undefined, name: string, possibleTypes: string) => string =
    (description, name, possibleTypes) => wrapWithDocumentation(
      addSemicolon(typeBuilder(name, possibleTypes)),
      { description, tags: [] }
    ) + '\n\n';

  const typeNameDeclaration: (name: string) => string = name => addSemicolon(`__typename: "${name}"`);

  type GenerateInterfaceDeclaration =
    (type: GraphQLNamedType, declaration: string, fields: string[], additionalInfo: string, isInput: boolean) => string;

  const generateInterfaceDeclaration: GenerateInterfaceDeclaration =
    ({ name, description }, declaration, fields, additionalInfo, isInput) => {
      if (!isInput && !optionsInput.ignoreTypeNameDeclaration) {
        fields = [typeNameDeclaration(name), ...fields];
      }

      return additionalInfo + wrapWithDocumentation(
        interfaceBuilder(declaration, gID(fields)),
        { description, tags: [] }
      );
    };

  type GenerateEnumDeclaration = (description: string | null | undefined, name: string, enumValues: GraphQLEnumValue[]) => string;

  const generateEnumDeclaration: GenerateEnumDeclaration = (description, name, enumValues) => {
    if (!enumTypeBuilder) {
      console.warn(
        'Missing `enumTypeBuilder` from language file and falling back to using a type for enums. This new option was added in v1.5.0'
      );
    }

    const formattedEnum: string = formatEnum(enumValues, generateDocumentation);
    return wrapWithDocumentation(
      (enumTypeBuilder || typeBuilder)(
        generateEnumName(name),
        // Only add semicolon when not using enum type builder
        enumTypeBuilder ? formattedEnum : addSemicolon(formattedEnum)
      ),
      { description, tags: [] }
    );
  };

  type ResolvedInterfaceValue = {
    value: ResolvedInterfaceValue | string;
    description?: string;
    deprecation?: string;
    isList: boolean;
    isNonNull: boolean;
  };

  type ResolveInterfaceName = (type: GraphQLInputType | GraphQLType, isNonNull: boolean) => ResolvedInterfaceValue;

  /**
   * TODO
   * - add support for custom types (via optional json file or something)
   */
  const resolveInterfaceName: ResolveInterfaceName = (type, isNonNull = false) => {
    if (isList(type)) {
      return {
        value: resolveInterfaceName(type.ofType, false),
        isList: true,
        isNonNull
      };
    }
    if (isNonNullable(type)) {
      return resolveInterfaceName(type.ofType, true);
    }
    if (isScalar(type)) {
      return {
        value: TYPE_MAP[type.name] || TYPE_MAP.__DEFAULT,
        isList: false,
        isNonNull
      };
    }
    if (isAbstractType(type)) {
      return {
        value: generateTypeName(type.name),
        isList: false,
        isNonNull
      };
    }
    if (isEnum(type)) {
      return {
        value: generateEnumName(type.name),
        isList: false,
        isNonNull
      };
    }
    return {
      value: generateInterfaceName(type.name),
      isList: false,
      isNonNull
    };
  };

  type TypePrinter = (val: ResolvedInterfaceValue | string, supportsNullability: boolean) => string;

  const typePrinter: TypePrinter = (val, supportsNullability) => {
    if (typeof val === 'string') {
      return val;
    }
    const isNonNull: boolean = !supportsNullability || val.isNonNull;
    if (val.isList) {
      return printType(wrapList(typePrinter(val.value, supportsNullability)), isNonNull);
    }

    return printType(typePrinter(val.value, supportsNullability), isNonNull);
  };

  type FieldToDefinition = (field: GraphQLField<any, any> | GraphQLInputField, isInput: boolean, supportsNullability: boolean) => string;

  const fieldToDefinition: FieldToDefinition = (field, isInput, supportsNullability) => {
    const resolved: ResolvedInterfaceValue = resolveInterfaceName(field.type, false);

    return formatInput(
      field.name,
      isInput && !resolved.isNonNull,
      typePrinter(resolved, supportsNullability)
    );
  };

  type ArgumentToDefinition = (arg: GraphQLArgument, supportsNullability: boolean) => string;

  const generateArgumentDeclaration: ArgumentToDefinition = (arg, supportsNullability) => {
    const resolved: ResolvedInterfaceValue = resolveInterfaceName(arg.type, false);

    return filterAndJoinArray([
      generateDocumentation(buildDocumentation(arg)),
      formatInput(arg.name, !resolved.isNonNull, typePrinter(resolved, supportsNullability))
    ]);
  };

  type ArgumentsToDefinition = (
    field: GraphQLField<any, any> | GraphQLInputField,
    parentName: string,
    supportsNullability: boolean
  ) => string | null;

  const generateArgumentsDeclaration: ArgumentsToDefinition = (field, parentName, supportsNullability) => {
    if (isInputField(field) || !field.args || !field.args.length) {
      return null;
    }

    const fieldDeclaration: string[] = field.args.map(arg => generateArgumentDeclaration(arg, supportsNullability));
    const name: string = generateInterfaceName(`${field.name}_On_${parentName}`) + 'Arguments';

    return interfaceBuilder(name, gID(fieldDeclaration));
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

  type TypeToInterface = (
    type: GraphQLNamedType,
    ignoredTypes: Set<string>,
    supportsNullability: boolean
  ) => string | null;

  type GenerateAbstractTypeDeclaration = (type: GraphQLAbstractType, ignoredTypes: Set<string>) => string;

  const generateAbstractTypeDeclaration: GenerateAbstractTypeDeclaration = (type, ignoredTypes) => {
    const poss: ReadonlyArray<GraphQLObjectType> = schemaInput.getPossibleTypes(type);
    let possibleTypes: string[] = poss
      .filter(t => !ignoredTypes.has(t.name))
      .map(t => generateInterfaceName(t.name));

    return generateTypeDeclaration(type.description, generateTypeName(type.name), possibleTypes.join(' | '));
  };

  const typeToInterface: TypeToInterface = (type, ignoredTypes, supportsNullability) => {
    if (isScalar(type)) {
      return null;
    }

    if (isUnion(type)) {
      return generateAbstractTypeDeclaration(type, ignoredTypes);
    }

    if (isEnum(type)) {
      return generateEnumDeclaration(type.description, type.name, type.getValues());
    }

    const isInput: boolean = type instanceof GraphQLInputObjectType;
    const f1: GraphQLInputFieldMap | GraphQLFieldMap<any, any> = type.getFields();
    const f: Array<GraphQLField<any, any> | GraphQLInputField> = Object.keys(f1).map(k => f1[k]);

    const filteredFields: Array<GraphQLField<any, any> | GraphQLInputField> = f.filter(field => filterField(field, ignoredTypes));

    const fields: string[] = filteredFields
      .map(field => [generateDocumentation(buildDocumentation(field)), fieldToDefinition(field, isInput, supportsNullability)])
      .reduce((acc, val) => [...acc, ...val], [])
      .filter(Boolean);

    const interfaceDeclaration: string = generateInterfaceName(type.name);
    let additionalInfo: string = '';

    if (isAbstractType(type)) {
      additionalInfo = generateAbstractTypeDeclaration(type, ignoredTypes);
    }

    return filterAndJoinArray(
      [
        generateInterfaceDeclaration(type, interfaceDeclaration, fields, additionalInfo, isInput),
        ...filteredFields.map(field => generateArgumentsDeclaration(field, type.name, supportsNullability))
      ],
      '\n\n'
    );
  };

  const typesToInterfaces: (schema: GraphQLSchema, options: Partial<IInternalOptions>) => string = (schema, options) => {
    const ignoredTypes: Set<string> = new Set(options.ignoredTypes);
    const supportsNullability: boolean = !options.legacy;
    const types: { [typeName: string]: GraphQLNamedType } = schema.getTypeMap();
    const typeArr: GraphQLNamedType[] = Object.keys(types).map(k => types[k]);

    const typeInterfaces: string[] =
      typeArr
        .filter(type => !type.name.startsWith('__'))  // remove introspection types
        .filter(type =>                               // remove ignored types
          !ignoredTypes.has(type.name)
        )
        .map(type =>                                  // convert to interface
          typeToInterface(type, ignoredTypes, supportsNullability)!
        );

    return filterAndJoinArray(
      [
        generateRootTypes(schema),
        ...typeInterfaces
      ],
      '\n\n'
    );
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
