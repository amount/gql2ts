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
  isAbstractType,
} from 'graphql';
import {
  schemaFromInputs,
  isList,
  isNonNullable,
  isEnum,
  filterAndJoinArray,
} from '@gql2ts/util';
import {
  GetChildSelectionsType,
  IChildSelection,
  IComplexTypeSignature,
  IFromQueryOptions,
  FromQuerySignature,
  HandleNamedTypes,
  HandleInputTypes,
  ConvertToTypeSignature,
  ITypeMap,
  IFromQueryReturnValue,
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
import { isSelectionSetExhaustive, expandFragments } from './fragment';

const doIt: FromQuerySignature = (schema, query, typeMap = {}, providedOptions = {}) => {
  const enumDeclarations: Map<string, string> = new Map<string, string>();

  const {
    wrapList,
    wrapPartial,
    generateSubTypeInterfaceName,
    printType,
    formatInput,
    generateFragmentName,
    generateQueryName,
    interfaceBuilder,
    typeBuilder,
    typeJoiner,
    generateInterfaceDeclaration,
    exportFunction,
    postProcessor,
    generateInputName,
    addExtensionsToInterfaceName,
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

  const getSubtype: SubtypeNamerAndDedupe = GenerateSubtypeCache();

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

  const UndefinedDirectives: Set<string> = new Set(['include', 'skip']);

  const isUndefinedFromDirective: (directives: ReadonlyArray<DirectiveNode> | null | undefined) => boolean = directives => {
    if (!directives || !directives.length) { return false; }

    const badDirectives: DirectiveNode[] = directives.filter(d => !UndefinedDirectives.has(d.name.value));
    const hasDirectives: boolean = directives.some(d => UndefinedDirectives.has(d.name.value));

    if (badDirectives.length) {
      console.error('Found some unknown directives:');
      badDirectives.forEach(d => console.error(d.name.value));
    }

    return hasDirectives;
  };

  const getOperationFields: (operation: OperationTypeNode) => GraphQLObjectType | null | undefined = operation => {
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

  const wrapPossiblePartial: (possiblePartial: IChildSelection) => string = possiblePartial => {
    if (possiblePartial.isPartial) {
      return wrapPartial(possiblePartial.iface);
    } else {
      return possiblePartial.iface;
    }
  };

  const flattenComplexTypes: (children: IChildSelection[]) => IComplexTypeSignature[] = children => (
    children.reduce((acc, child) => { acc.push(...child.complexTypes); return acc; }, [] as IComplexTypeSignature[])
  );

  type GetField = (operation: OperationTypeNode, selection: FieldNode, parent?: GraphQLType) => GraphQLField<any, any>;
  const getField: GetField = (operation, selection, parent) => {
    if (parent && isCompositeType(parent)) {
      if (parent instanceof GraphQLUnionType) {
        return parent.getTypes().map(t => t.getFields()[selection.name.value]).find(z => !!z)!;
      } else {
        return parent.getFields()[selection.name.value];
      }
    } else {
      const operationFields: GraphQLObjectType | null | undefined = getOperationFields(operation);
      // operation is taken from the schema, so it should never be falsy
      return operationFields!.getFields()[selection.name.value];
    }
  };

  const rootIntrospectionTypes: Map<string, string> = new Map([[ '__schema', '__Schema' ], [ '__type', '__Type' ]]);

  const getChildSelections: GetChildSelectionsType = (operation, selection, parent?, isUndefined = false): IChildSelection => {
    let str: string = '';
    let isFragment: boolean = false;
    let isPartial: boolean = false;
    let complexTypes: IComplexTypeSignature[] = [];
    if (selection.kind === 'Field') {
      const field: GraphQLField<any, any> = getField(operation, selection, parent);
      const originalName: string = selection.name.value;
      const selectionName: string = selection.alias ? selection.alias.value : originalName;
      let childType: string | undefined;

      isUndefined = isUndefined || isUndefinedFromDirective(selection.directives);
      let resolvedType: string;
      if (originalName === '__typename') {
        if (!parent) {
          resolvedType = TypeMap.String;
        } else if (isAbstractType(parent)) {
          const possibleTypes: ReadonlyArray<GraphQLObjectType> = parsedSchema.getPossibleTypes(parent);
          /**
           * @TODO break this OR logic out of here (and the other places) and put into a printer
           * @TODO break out the string-literal type out of here as it probably isn't supported by other languages
           */
          resolvedType = possibleTypes.map(({ name }) => `'${name}'`).join(' | ');
        } else {
          resolvedType = `'${parent.toString()}'`;
        }
      } else if (!!selection.selectionSet) {
        let newParent: GraphQLCompositeType | undefined;
        const fieldType: GraphQLNamedType | null | undefined = rootIntrospectionTypes.has(originalName) ? parsedSchema.getType(
          rootIntrospectionTypes.get(originalName)!
        ) : getNamedType(field.type);
        if (isCompositeType(fieldType)) {
          newParent = fieldType;
        }

        const selections: IChildSelection[] =
          selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, newParent));

        const nonFragments: IChildSelection[] = selections.filter(s => !s.isFragment);
        let fragments: IChildSelection[] = selections.filter(s => s.isFragment);

        /**
         * WIP, but remove "Partial", need to make it use OR instead of AND. Also obviously shouldn't be doing
         * string replaces (especially because other languages might not use the `Partial` type (or even have that
         * capability)
         */
        if (fragments.length) {
          expandFragments(selection, parent as any, parsedSchema);

          fragments = fragments.reduce((acc, frag) => {
            if (frag.iface.startsWith('Partial<')) {
              return [...acc, {...frag, iface: frag.iface.replace('Partial<', '').replace('>', '')}];
            }
            return [...acc, frag];
          }, []);

          if (!isSelectionSetExhaustive(selection, parent as any, parsedSchema)) {
            fragments.push({
              complexTypes: [],
              iface: '{}',
              isFragment: false,
              isPartial: false
            });
          }
        }
        const andOps: string[] = [];

        complexTypes.push(...flattenComplexTypes(selections));

        if (nonFragments.length) {
          const nonPartialNonFragments: IChildSelection[] = nonFragments.filter(nf => !nf.isPartial);
          const partialNonFragments: IChildSelection[] = nonFragments.filter(nf => nf.isPartial);

          if (nonPartialNonFragments.length) {
            const interfaceDeclaration: string = generateInterfaceDeclaration(nonPartialNonFragments.map(f => f.iface));
            const subtypeInfo: ISubtypeMetadata | null = getSubtype(selection, interfaceDeclaration, generateSubTypeInterfaceName);
            const newInterfaceName: string | null = subtypeInfo ? subtypeInfo.name : null;
            andOps.push(newInterfaceName || interfaceDeclaration);
            if (newInterfaceName && subtypeInfo && !subtypeInfo.dupe) {
              complexTypes.push({ iface: interfaceDeclaration, isPartial: false, name: newInterfaceName });
            }
          }

          if (partialNonFragments.length) {
            const interfaceDeclaration: string =
              wrapPartial(generateInterfaceDeclaration(partialNonFragments.map(f => f.iface)));
            const subtypeInfo: ISubtypeMetadata | null = getSubtype(selection, interfaceDeclaration, generateSubTypeInterfaceName);
            const newInterfaceName: string | null = subtypeInfo ? subtypeInfo.name : null;
            andOps.push(newInterfaceName || interfaceDeclaration);
            if (newInterfaceName && subtypeInfo && !subtypeInfo.dupe) {
              complexTypes.push({ iface: interfaceDeclaration, isPartial: true, name: newInterfaceName });
            }
          }
        }

        if (fragments.length) {
          andOps.push(`(${fragments.map(wrapPossiblePartial).join(' | ')})`);
        }
        childType = typeJoiner(andOps);
        resolvedType = convertToType(field ? field.type : fieldType!, false, childType);
      } else {
        resolvedType = convertToType(field.type, false, childType);
      }
      str = formatInput(selectionName, isUndefined, resolvedType);
    } else if (selection.kind === 'FragmentSpread') {
      str = generateFragmentName(selection.name.value);
      isFragment = true;
      isPartial = isUndefinedFromDirective(selection.directives);
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      let fragName: string = '';

      if (!anon && selection.typeCondition) {
        const typeName: string = selection.typeCondition.name.value;
        parent = parsedSchema.getType(typeName)!;
        isFragment = true;
        fragName = generateFragmentName(`SpreadOn${typeName}`);
      }

      const selections: IChildSelection[] =
        selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, parent, false));

      const fragmentSelections: IChildSelection[] = selections.filter(({ isFragment: frag }) => frag);
      const nonFragmentSelections: IChildSelection[] = selections.filter(({ isFragment: frag }) => !frag);

      /**
       * @TODO need to handle fragments of fragments better
       * An example of a previously unsupported fragment can be found in the __tests__ directory
       * `fragmentSelections.length` is definitely a hack and a proper solution should be investigated
       * See: https://github.com/avantcredit/gql2ts/issues/76
       */
      if (!fragmentSelections.length && anon) {
        let joinSelections: string = filterAndJoinArray(selections.map(s => s.iface), '\n');
        isPartial = isUndefinedFromDirective(selection.directives);
        complexTypes.push(...flattenComplexTypes(selections));
        return {
          iface: joinSelections,
          isFragment: false,
          isPartial,
          complexTypes,
        };
      } else {
        let joinSelections: string[] = nonFragmentSelections.map(s => s.iface);
        isPartial = isUndefinedFromDirective(selection.directives);
        complexTypes.push(...flattenComplexTypes(selections));

        const interfaces: string[] = fragmentSelections.map(({ iface }) => iface);

        if (joinSelections.length) {
          complexTypes.push({ name: fragName, iface: generateInterfaceDeclaration(joinSelections), isPartial: false });
          interfaces.push(fragName);
        }

        return {
          // Avoid Double Partial, i.e. Partial<Partial<IFragmentOnWhatever>>
          iface: interfaces.length === 1 && isPartial ? interfaces[0] : typeJoiner(interfaces.map(wrapPartial)),
          isFragment,
          isPartial,
          complexTypes,
        };
      }
    }

    return {
      iface: str,
      isFragment,
      isPartial,
      complexTypes,
    };
  };

  const getVariables: (variables: ReadonlyArray<VariableDefinitionNode>) => string[] = variables => (
    variables.map(v => {
      const optional: boolean = v.type.kind !== 'NonNullType';
      return formatInput(v.variable.name.value, optional, convertVariable(v.type));
    })
  );

  const variablesToInterface: (operationName: string, variables: ReadonlyArray<VariableDefinitionNode> | undefined) => string = (opName, variables) => {
    if (!variables || !variables.length) { return ''; }
    const variableTypeDefs: string[] = getVariables(variables);
    return postProcessor(exportFunction(interfaceBuilder(generateInputName(opName), generateInterfaceDeclaration(variableTypeDefs))));
  };

  const buildAdditionalTypes: (children: IChildSelection[]) => string[] = children => {
    const subTypes: IComplexTypeSignature[] = flattenComplexTypes(children);
    return subTypes.map(subtype => {
      if (subtype.isPartial) {
        return postProcessor(exportFunction(typeBuilder(subtype.name, subtype.iface)));
      } else {
        return postProcessor(exportFunction(interfaceBuilder(subtype.name, subtype.iface)));
      }
    });
  };

  const getEnums: () => string[] = () => [
    ...enumDeclarations.values()
  ].map(enumDecl => postProcessor(exportFunction(enumDecl)));

  interface IOutputJoinInput {
    variables: string;
    interface: string;
    additionalTypes: string[];
  }

  const joinOutputs: (output: IOutputJoinInput) => IFromQueryReturnValue = output => {
    const { variables, additionalTypes, interface: iface } = output;
    const result: string = postProcessor(filterAndJoinArray([variables, ...additionalTypes, iface], '\n\n'));
    return {
      ...output,
      result
    };
  };

  return parsedSelection.definitions.map(def => {
    if (def.kind === 'OperationDefinition') {
      const ifaceName: string = generateQueryName(def);
      const variableInterface: string = variablesToInterface(ifaceName, def.variableDefinitions);
      const ret: IChildSelection[] = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel));
      const fields: string[] = ret.map(x => x.iface);
      const iface: string = postProcessor(exportFunction(interfaceBuilder(ifaceName, generateInterfaceDeclaration(fields))));
      const additionalTypes: string[] = buildAdditionalTypes(ret);

      return joinOutputs({
        variables: variableInterface,
        interface: iface,
        additionalTypes,
      });
    } else if (def.kind === 'FragmentDefinition') {
      const ifaceName: string = generateFragmentName(def.name.value);
      // get the correct type
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType)!;

      const ret: IChildSelection[] = def.selectionSet.selections.map(sel => getChildSelections('query', sel, foundType));
      const extensions: string[] = ret.filter(x => x.isFragment).map(x => x.iface);
      const fields: string[] = ret.filter(x => !x.isFragment).map(x => x.iface);
      const iface: string = postProcessor(
        exportFunction(
          interfaceBuilder(
            addExtensionsToInterfaceName(ifaceName, extensions),
            generateInterfaceDeclaration(fields)
          )
        )
      );
      const additionalTypes: string[] = buildAdditionalTypes(ret);

      return joinOutputs({
        interface: iface,
        variables: '',
        additionalTypes,
      });
    } else {
      throw new Error(`Unsupported Definition ${def.kind}`);
    }
  }).concat(
    enumDeclarations.size ? [
      joinOutputs({
        additionalTypes: getEnums(),
        interface: '',
        variables: ''
      })
    ] : []
  );
};

export default doIt;
