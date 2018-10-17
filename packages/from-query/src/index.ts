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
  FromQuerySignature,
} from '@gql2ts/types';
import {
  DEFAULT_TYPE_MAP,
  DEFAULT_OPTIONS,
} from '@gql2ts/language-typescript';
import { flattenFragments } from './flattenQuery';
import convertToIr, { IOperation } from './ir';
import generateTypes from './generate';

const doIt: FromQuerySignature = (schema, query, typeMap = {}, providedOptions = {}) => {
  const options: IFromQueryOptions = {
    ...DEFAULT_OPTIONS,
    ...providedOptions,
    typeMap: {
      ...DEFAULT_TYPE_MAP,
      ...DEFAULT_OPTIONS.typeMap,
      ...(providedOptions.typeMap ? providedOptions.typeMap : {}),
      ...typeMap
    }
  };

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
    typeMap: TypeMap,
  }: IFromQueryOptions = options;

  const parsedSchema: GraphQLSchema = schemaFromInputs(schema);
  const parsedSelection: DocumentNode = parse(query);

  const handleInputObject: (type: GraphQLInputObjectType, isNonNull: boolean) => string = (type, isNonNull) => {
    const variables: GraphQLInputField[] = Object.keys(type.getFields()).map(k => type.getFields()[k]);
    const variableDeclarations: string[] = variables.map(v => {
      // TODO fix this
      const convertedType: string = convertToType(v.type);

      return formatInput(v.name, convertedType.endsWith('null'), convertedType);
    });
    const builder: string = generateInterfaceDeclaration(variableDeclarations);
    return printType(builder, isNonNull);
  };

  const typeUnion: (types: string[]) => string = types => types.join(' | ');

  const handleEnum: (type: GraphQLEnumType, isNonNull: boolean) => string = (type, isNonNull) => (
    printType(
      typeUnion(type.getValues().map(({ value }) => `'${value}'`)),
      isNonNull
    )
  );

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
    } else if (type instanceof GraphQLInputObjectType) {
      return handleInputObject(type, isNonNull);
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
    return exportFunction(interfaceBuilder(generateInputName(opName), generateInterfaceDeclaration(variableTypeDefs)));
  };

  const flattenedQuery: DocumentNode = flattenFragments(parsedSelection, parsedSchema);
  const internalRepresentation: IOperation = convertToIr(parsedSchema, flattenedQuery);

  const variableInterfaces: string[] = parsedSelection.definitions.map(def => {
    if (def.kind !== 'OperationDefinition') { return ''; }

    const ifaceName: string = generateQueryName(def);
    return variablesToInterface(ifaceName, def.variableDefinitions);
  });

  return postProcessor(
    filterAndJoinArray([
      generateTypes(options)(internalRepresentation),
      '\n',
      ...variableInterfaces
    ])
  );
};

export default doIt;
