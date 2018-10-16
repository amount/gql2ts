import {
  parse,
  GraphQLSchema,
  DocumentNode,
  GraphQLType,
  VariableDefinitionNode,
  TypeNode,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputField,
} from 'graphql';
import {
  schemaFromInputs,
  isList,
  isNonNullable,
  isEnum,
  filterAndJoinArray,
} from '@gql2ts/util';
import {
  IFromQueryOptions,
  HandleNamedTypes,
  HandleInputTypes,
  ConvertToTypeSignature,
  ITypeMap,
} from '@gql2ts/types';
import {
  DEFAULT_TYPE_MAP,
  DEFAULT_OPTIONS,
} from '@gql2ts/language-typescript';
import { flattenFragments } from './flattenQuery';
import convertToIr, { IOperation } from './ir';
import { generateTypes } from './generate';

const doIt: any = (schema, query, typeMap = {}, providedOptions = {}) => {
  const enumDeclarations: Map<string, string> = new Map<string, string>();

  const {
    wrapList,
    printType,
    formatInput,
    generateQueryName,
    interfaceBuilder,
    generateInterfaceDeclaration,
    exportFunction,
    postProcessor,
    generateInputName,
    enumTypeBuilder,
    formatEnum,
    generateEnumName,
    generateDocumentation,
    typeMap: langTypeMap
  }: IFromQueryOptions = { ...DEFAULT_OPTIONS, ...providedOptions };

  const TypeMap: ITypeMap = {
    ...DEFAULT_TYPE_MAP,
    ...langTypeMap,
    ...typeMap,
  };

  const parsedSchema: GraphQLSchema = schemaFromInputs(schema);
  const parsedSelection: DocumentNode = parse(query);

  const handleInputObject: (type: GraphQLInputObjectType, isNonNull: boolean) => string = (type, isNonNull) => {
    const variables: GraphQLInputField[] = Object.keys(type.getFields()).map(k => type.getFields()[k]);
    const variableDeclarations: string[] = variables.map(v => formatInput(v.name, true, convertToType(v.type)));
    const builder: string = generateInterfaceDeclaration(variableDeclarations.map(v => v));
    return printType(builder, isNonNull);
  };

  const handleEnum: (type: GraphQLEnumType, isNonNull: boolean) => string = (type, isNonNull) => {
    const enumName: string = generateEnumName(type.name);

    if (!enumDeclarations.has(type.name)) {
      const enumDeclaration: string = enumTypeBuilder(enumName, formatEnum(type.getValues(), generateDocumentation));
      enumDeclarations.set(type.name, enumDeclaration);
    }

    return printType(enumName, isNonNull);
  };

  const handleNamedTypeInput: (type: TypeNode, isNonNull: boolean) => string | undefined = (type, isNonNull) => {
    if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
      const newType: GraphQLType | undefined | null = parsedSchema.getType(type.name.value);
      if (newType instanceof GraphQLEnumType) {
        return handleEnum(newType, isNonNull);
      } else if (newType instanceof GraphQLInputObjectType) {
        return handleInputObject(newType, isNonNull);
      }
    }
  };

  const handleRegularType: HandleNamedTypes = (type, isNonNull, replacement) => {
    const typeValue: string = (typeof type.name === 'string') ? type.toString() : type.name.value;
    const showValue: string = replacement || typeValue;
    const show: string = TypeMap[showValue] || (replacement ? showValue : TypeMap.__DEFAULT);
    return printType(show, isNonNull);
  };

  const convertVariable: HandleInputTypes = (type, isNonNull = false, replacement = null) => {
    if (type.kind === 'ListType') {
      return printType(wrapList(convertVariable(type.type, false, replacement)), isNonNull!);
    } else if (type.kind === 'NonNullType') {
      return convertVariable(type.type, true, replacement);
    } else {
      return handleNamedTypeInput(type, isNonNull!) || handleRegularType(type, isNonNull!, replacement!);
    }
  };

  const convertToType: ConvertToTypeSignature = (type, isNonNull = false, replacement = null) => {
    if (isList(type)) {
      return printType(wrapList(convertToType(type.ofType, false, replacement)), isNonNull!);
    } else if (isNonNullable(type)) {
      return convertToType(type.ofType, true, replacement);
    } else if (isEnum(type)) {
      return handleEnum(type, isNonNull!);
    } else {
      return handleRegularType(type, isNonNull!, replacement!);
    }
  };

  const getVariables: (variables: ReadonlyArray<VariableDefinitionNode>) => string[] = variables => (
    variables.map(v => {
      const optional: boolean = v.type.kind !== 'NonNullType';
      return formatInput(v.variable.name.value, optional, convertVariable(v.type));
    })
  );

  const variablesToInterface: (operationName: string, variables: ReadonlyArray<VariableDefinitionNode> | undefined) => string = (
    opName,
    variables
  ) => {
    if (!variables || !variables.length) { return ''; }

    const variableTypeDefs: string[] = getVariables(variables);
    return postProcessor(exportFunction(interfaceBuilder(generateInputName(opName), generateInterfaceDeclaration(variableTypeDefs))));
  };

  const flattenedQuery: DocumentNode = flattenFragments(parsedSelection, parsedSchema);
  const internalRepresentation: IOperation = convertToIr(parsedSchema, flattenedQuery);

  const variableInterfaces: string[] = parsedSelection.definitions.map(def => {
    if (def.kind !== 'OperationDefinition') { return ''; }

    const ifaceName: string = generateQueryName(def);
    return variablesToInterface(ifaceName, def.variableDefinitions);
  });

  return filterAndJoinArray([
    generateTypes(internalRepresentation),
    '\n',
    variableInterfaces
  ]);
};

export default doIt;
