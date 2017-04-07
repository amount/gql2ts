import {
  parse,
  GraphQLSchema,
  DocumentNode,
  GraphQLField,
  GraphQLCompositeType,
  isCompositeType,
  getNamedType,
  GraphQLType,
  VariableDefinitionNode,
  TypeNode,
  OperationTypeNode,
  GraphQLObjectType,
  GraphQLEnumType,
  DirectiveNode,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLUnionType,
  GraphQLNamedType,
  FieldNode,
} from 'graphql';
import {
  schemaFromInputs,
  isList,
  isNonNullable,
  isEnum,
} from '@gql2ts/util';
import {
  ChildSelectionsType,
  IChildren,
  IComplexTypeSignature,
  IOptions,
  Signature,
  RegularTypeSignature,
  VariableTypeSignature,
  convertToTypeSignature,
  ITypeMap,
} from '@gql2ts/types';
import {
  DEFAULT_TYPE_MAP,
  DEFAULT_OPTIONS,
} from '@gql2ts/language-typescript';
import {
  GenerateSubtypeCache,
  SubtypeNamerAndDedupe,
  ISubtypeMetadata,
} from './subtype';

const doIt: Signature = (schema, query, typeMap= {}, providedOptions= {}) => {
  const TypeMap: ITypeMap = {
    ...DEFAULT_TYPE_MAP,
    ...typeMap
  };

  const {
    buildRootInterfaceName,
    formatFragmentInterface,
    formatInterface,
    formatVariableInterface,
    wrapList,
    wrapPartial,
    generateSubTypeInterfaceName,
    printType,
    formatInput,
    generateFragmentName,
    generateQueryName,
    formatEnum,
    defaultIndentation,
    interfaceBuilder,
    typeBuilder,
    typeJoiner,
    generateInterfaceDeclaration,
    exportFunction,
  }: IOptions = { ...DEFAULT_OPTIONS, ...providedOptions };

  const getSubtype: SubtypeNamerAndDedupe = GenerateSubtypeCache();

  const parsedSchema: GraphQLSchema = schemaFromInputs(schema);
  const parsedSelection: DocumentNode = parse(query);

  const handleInputObject: (type: GraphQLInputObjectType, isNonNull: boolean) => string = (type, isNonNull) => {
    const variables: GraphQLInputField[] = Object.keys(type.getFields()).map(k => type.getFields()[k]);
    const variableDeclarations: string[] = variables.map(v => formatInput(v.name, true, convertToType(v.type)));
    const builder: string = generateInterfaceDeclaration(variableDeclarations.map(v => `    ${v}`), defaultIndentation);
    return printType(builder, isNonNull);
  };

  const handleEnum: (type: GraphQLEnumType, isNonNull: boolean) => string = (type, isNonNull) => {
    const decl: string = formatEnum(type.getValues());
    return printType(decl, isNonNull);
  };

  const handleNamedTypeInput: (type: TypeNode, isNonNull: boolean) => string | undefined = (type, isNonNull) => {
    if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
      const newType: GraphQLType = parsedSchema.getType(type.name.value);
      if (newType instanceof GraphQLEnumType) {
        return handleEnum(newType, isNonNull);
      } else if (newType instanceof GraphQLInputObjectType) {
        return handleInputObject(newType, isNonNull);
      }
    }
  };

  const handleRegularType: RegularTypeSignature = (type, isNonNull, replacement) => {
    const typeValue: string = (typeof type.name === 'string') ? type.toString() : type.name.value;
    const showValue: string = replacement || typeValue;
    const show: string = TypeMap[showValue] || (replacement ? showValue : TypeMap.__DEFAULT);
    return printType(show, isNonNull);
  };

  const convertVariable: VariableTypeSignature = (type, isNonNull= false, replacement= null) => {
    if (type.kind === 'ListType') {
      return printType(wrapList(convertVariable(type.type, false, replacement)), isNonNull!);
    } else if (type.kind === 'NonNullType') {
      return convertVariable(type.type, true, replacement);
    } else {
      return handleNamedTypeInput(type, isNonNull!) || handleRegularType(type, isNonNull!, replacement!);
    }
  };

  const convertToType: convertToTypeSignature = (type, isNonNull= false, replacement= null): string => {
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

  const UndefinedDirectives: Set<string> = new Set(['include', 'skip']);

  const isUndefinedFromDirective: (directives: DirectiveNode[] | undefined) => boolean = directives => {
    if (!directives || !directives.length) { return false; }

    const badDirectives: DirectiveNode[] = directives.filter(d => !UndefinedDirectives.has(d.name.value));
    const hasDirectives: boolean = directives.some(d => UndefinedDirectives.has(d.name.value));

    if (badDirectives.length) {
      console.error('Found some unknown directives:');
      badDirectives.forEach(d => console.error(d.name.value));
    }

    return hasDirectives;
  };

  const getOperationFields: (operation: OperationTypeNode) => GraphQLObjectType = operation => {
    switch (operation) {
      case 'query':
        return parsedSchema.getQueryType();
      case 'mutation':
        return parsedSchema.getMutationType();
      case 'subscription':
        return parsedSchema.getSubscriptionType();
      default:
        throw new Error('Unsupported Operation');
    }
  };

  const wrapPossiblePartial: (possiblePartial: IChildren) => string = possiblePartial => {
    if (possiblePartial.isPartial) {
      return wrapPartial(possiblePartial.iface);
    } else {
      return possiblePartial.iface;
    }
  };

  const flattenComplexTypes: (children: IChildren[]) => IComplexTypeSignature[] = children => (
    children.reduce((acc, child) => { acc.push(...child.complexTypes); return acc; }, [] as IComplexTypeSignature[])
  );

  // @FIXME this is pretty bad
  const fixIndentationForSubtype: (decl: string) => string =
    decl => decl.replace(/\n\s+/g, `\n${defaultIndentation}`).replace(defaultIndentation + '}', '}');

  type GetField = (operation: OperationTypeNode, selection: FieldNode, parent?: GraphQLType) => GraphQLField<any, any>;
  const getField: GetField = (operation, selection, parent) => {
    if (parent && isCompositeType(parent)) {
      if (parent instanceof GraphQLUnionType) {
        return parent.getTypes().map(t => t.getFields()[selection.name.value]).find(z => !!z)!;
      } else {
        return parent.getFields()[selection.name.value];
      }
    } else {
      const operationFields: GraphQLObjectType = getOperationFields(operation);
      return operationFields.getFields()[selection.name.value];
    }
  };

  const getChildSelections: ChildSelectionsType = (operation, selection, indentation= '', parent?, isUndefined= false): IChildren => {
    let str: string = '';
    let isFragment: boolean = false;
    let isPartial: boolean = false;
    let complexTypes: IComplexTypeSignature[] = [];

    if (selection.kind === 'Field') {
      const field: GraphQLField<any, any> = getField(operation, selection, parent);
      const selectionName: string = selection.alias ? selection.alias.value : selection.name.value;
      let childType: string | undefined;

      isUndefined = isUndefined || isUndefinedFromDirective(selection.directives);
      let resolvedType: string;
      if (selectionName.startsWith('__')) {
        resolvedType = TypeMap.String;
      } else if (!!selection.selectionSet) {
        let newParent: GraphQLCompositeType | undefined;
        const fieldType: GraphQLNamedType = getNamedType(field.type);
        if (isCompositeType(fieldType)) {
          newParent = fieldType;
        }

        const selections: IChildren[] =
          selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + defaultIndentation,  newParent));

        const nonFragments: IChildren[] = selections.filter(s => !s.isFragment);
        const fragments: IChildren[] = selections.filter(s => s.isFragment);
        const andOps: string[] = [];

        complexTypes.push(...flattenComplexTypes(selections));

        if (nonFragments.length) {
          const nonPartialNonFragments: IChildren[] = nonFragments.filter(nf => !nf.isPartial);
          const partialNonFragments: IChildren[] = nonFragments.filter(nf => nf.isPartial);

          if (nonPartialNonFragments.length) {
            const interfaceDeclaration: string = generateInterfaceDeclaration(nonPartialNonFragments.map(f => f.iface), indentation);
            const subtypeInfo: ISubtypeMetadata | null = getSubtype(selection, interfaceDeclaration, generateSubTypeInterfaceName);
            const newInterfaceName: string | null = subtypeInfo ? subtypeInfo.name : null;
            andOps.push(newInterfaceName || interfaceDeclaration);
            if (newInterfaceName && subtypeInfo && !subtypeInfo.dupe) {
              complexTypes.push({ iface: fixIndentationForSubtype(interfaceDeclaration), isPartial: false, name: newInterfaceName });
            }
          }

          if (partialNonFragments.length) {
            const interfaceDeclaration: string =
              wrapPartial(generateInterfaceDeclaration(partialNonFragments.map(f => f.iface), indentation));
            const subtypeInfo: ISubtypeMetadata | null = getSubtype(selection, interfaceDeclaration, generateSubTypeInterfaceName);
            const newInterfaceName: string | null = subtypeInfo ? subtypeInfo.name : null;
            andOps.push(newInterfaceName || interfaceDeclaration);
            if (newInterfaceName && subtypeInfo && !subtypeInfo.dupe) {
              complexTypes.push({ iface: fixIndentationForSubtype(interfaceDeclaration), isPartial: true, name: newInterfaceName });
            }
          }
        }

        andOps.push(...fragments.map(wrapPossiblePartial));
        childType = typeJoiner(andOps);
        resolvedType = convertToType(field.type, false, childType);
      } else {
        resolvedType = convertToType(field.type, false, childType);
      }
      str = formatInput(indentation + selectionName, isUndefined, resolvedType);
    } else if (selection.kind === 'FragmentSpread') {
      str = generateFragmentName(selection.name.value);
      isFragment = true;
      isPartial = isUndefinedFromDirective(selection.directives);
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      if (!anon) {
        const typeName: string = selection.typeCondition!.name.value;
        parent = parsedSchema.getType(typeName);
      }

      const selections: IChildren[] =
        selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));

      let joinSelections: string = selections.map(s => s.iface).join('\n');
      isPartial = isUndefinedFromDirective(selection.directives);
      complexTypes.push(...flattenComplexTypes(selections));
      return {
        iface: joinSelections,
        isFragment,
        isPartial,
        complexTypes,
      };
    }

    return {
      iface: str,
      isFragment,
      isPartial,
      complexTypes,
    };
  };

  const getVariables: (variables: VariableDefinitionNode[]) => string[] = variables => (
    variables.map(v => {
      const optional: boolean = v.type.kind !== 'NonNullType';
      return formatInput(v.variable.name.value, optional, convertVariable(v.type));
    })
  );

  const variablesToInterface: (operationName: string, variables: VariableDefinitionNode[] | undefined) => string = (opName, variables) => {
    if (!variables || !variables.length) { return ''; }
    const variableTypeDefs: string[] = getVariables(variables);
    return exportFunction(formatVariableInterface(opName, variableTypeDefs));
  };

  const buildAdditionalTypes: (children: IChildren[]) => string[] = children => {
    const subTypes: IComplexTypeSignature[] = flattenComplexTypes(children);

    return subTypes.map(subtype => {
      if (subtype.isPartial) {
        return exportFunction(typeBuilder(subtype.name, subtype.iface));
      } else {
        return exportFunction(interfaceBuilder(subtype.name, subtype.iface));
      }
    });
  };

  return parsedSelection.definitions.map(def => {
    const ifaceName: string = buildRootInterfaceName(def, generateQueryName, generateFragmentName);
    if (def.kind === 'OperationDefinition') {
      const variableInterface: string = variablesToInterface(ifaceName, def.variableDefinitions);
      const ret: IChildren[] = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, defaultIndentation));
      const fields: string[] = ret.map(x => x.iface);
      const iface: string = exportFunction(formatInterface(ifaceName, fields));
      const additionalTypes: string[] = buildAdditionalTypes(ret);

      return {
        variables: variableInterface,
        interface: iface,
        additionalTypes,
      };
    } else if (def.kind === 'FragmentDefinition') {
      // get the correct type
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType);

      const ret: IChildren[] = def.selectionSet.selections.map(sel => getChildSelections('query', sel, defaultIndentation, foundType));
      const extensions: string[] = ret.filter(x => x.isFragment).map(x => x.iface);
      const fields: string[] = ret.filter(x => !x.isFragment).map(x => x.iface);
      const iface: string = exportFunction(formatFragmentInterface(ifaceName, fields, extensions));
      const additionalTypes: string[] = buildAdditionalTypes(ret);

      return {
        interface: iface,
        variables: '',
        additionalTypes,
      };
    } else {
      throw new Error(`Unsupported Definition ${def.kind}`);
    }
  });
};

export default doIt;
