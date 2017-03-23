import {
  buildSchema,
  parse,
  GraphQLSchema,
  DocumentNode,
  SelectionNode,
  GraphQLField,
  GraphQLCompositeType,
  isCompositeType,
  getNamedType,
  GraphQLType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLOutputType,
  VariableDefinitionNode,
  TypeNode,
  OperationTypeNode,
  GraphQLObjectType,
  GraphQLEnumType,
  DirectiveNode,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLUnionType,
  NamedTypeNode,
  GraphQLNamedType,
  DefinitionNode,
} from 'graphql';

interface IReturn {
  variables: string;
  interface: string;
}

type BuildRootInterfaceName = (definition: DefinitionNode) => string;
type InterfaceFormatters = (operationName: string, fields: string[]) => string;
type FragmentInterfaceFormatter = (operationName: string, fields: string[], extInterfaces: string) => string;

const formatInterface: InterfaceFormatters = (opName, fields) => `export interface ${opName} {
${fields.join('\n  ')}
}`;

const formatVariableInterface: InterfaceFormatters = (opName, fields) => `export interface ${opName}Input {
  ${fields.join('\n  ')}
}`;

const formatFragmentInterface: FragmentInterfaceFormatter = (opName, fields, ext) => `export interface ${opName}${ext} {
${fields.join('\n')}
}`;

const buildRootInterfaceName: BuildRootInterfaceName = def => {
  if (def.kind === 'OperationDefinition') {
    return def.name ? def.name.value : 'Anonymous';
  } else if (def.kind === 'FragmentDefinition') {
    return `IFragment${def.name.value}`;
  } else {
    throw new Error(`Unsupported Definition ${def.kind}`);
  }
};

export interface IOptions {
  buildRootInterfaceName: BuildRootInterfaceName;
  formatVariableInterface: InterfaceFormatters;
  formatInterface: InterfaceFormatters;
  formatFragmentInterface: FragmentInterfaceFormatter;
}

export interface IProvidedOptions extends Partial<IOptions> {};

export type Signature = (schema: GraphQLSchema | string, query: string, typeMap?: object, options?: IProvidedOptions) => IReturn[];

const doIt: Signature = (schema, query, typeMap= {}, providedOptions= {}) => {
  const TypeMap: { [x: string]: string | undefined } = {
    ID: 'string',
    String: 'string',
    Boolean: 'boolean',
    Float: 'number',
    Int: 'number',
    ...typeMap
  };

  const options: IOptions = {
    buildRootInterfaceName,
    formatVariableInterface,
    formatInterface,
    formatFragmentInterface,
    ...providedOptions
  };

  const parsedSchema: GraphQLSchema = (schema instanceof GraphQLSchema) ? schema : buildSchema(schema);
  const parsedSelection: DocumentNode = parse(query);

  function isNonNullable (type: GraphQLType): type is GraphQLNonNull<any> {
    return type instanceof GraphQLNonNull;
  }

  function isList (type: GraphQLType): type is GraphQLList<any> {
    return type instanceof GraphQLList;
  }

  const wrapList: (type: string) => string = type => `Array<${type}>`;

  const printType: (type: string, isNonNull: boolean) => string = (type, isNonNull) => isNonNull ? type : `${type} | null`;

  const handleInputObject: (type: GraphQLInputObjectType, isNonNull: boolean) => string = (type, isNonNull) => {
    const variables: GraphQLInputField[] = Object.keys(type.getFields()).map(k => type.getFields()[k]);
    const builder: string = `{\n${variables.map(v => `    ${v.name}?: ${convertToType(v.type)};`).join('\n')}\n  }`;
    return printType(builder, isNonNull);
  };

  const handleEnum: (type: GraphQLEnumType, isNonNull: boolean) => string = (type, isNonNull) => {
    const decl: string = type.getValues().map(en => `'${en.value}'`).join(' | ');
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

  type RegularTypeSignature = (type: NamedTypeNode | GraphQLNamedType, isNonNull: boolean, replacement: string | null) => string;

  const handleRegularType: RegularTypeSignature = (type, isNonNull, replacement) => {
    const typeValue: string = (typeof type.name === 'string') ? type.toString() : type.name.value;
    const showValue: string = replacement ? replacement : typeValue;
    const show: string = TypeMap[showValue] || (replacement ? showValue : 'any');
    return printType(show, isNonNull);
  };

  type VariableTypeSignature = (type: TypeNode, isNonNull?: boolean, replacement?: string | null) => string;

  const convertVariable: VariableTypeSignature = (type, isNonNull= false, replacement= null) => {
    if (type.kind === 'ListType') {
      return wrapList(convertVariable(type.type, false, replacement)) + printType('', isNonNull!);
    } else if (type.kind === 'NonNullType') {
      return convertVariable(type.type, true, replacement);
    } else {
      return handleNamedTypeInput(type, isNonNull!) || handleRegularType(type, isNonNull!, replacement!);
    }
  };

  type convertToTypeSignature = (type: GraphQLOutputType | GraphQLInputType, isNonNull?: boolean, replacement?: string | null) => string;

  const convertToType: convertToTypeSignature = (type, isNonNull= false, replacement= null): string => {
    if (isList(type)) {
      return wrapList(convertToType(type.ofType, false, replacement)) + printType('', isNonNull!);
    } else if (isNonNullable(type)) {
      return convertToType(type.ofType, true, replacement);
    } else if (type instanceof GraphQLEnumType) {
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

    if (hasDirectives) {
      return true;
    } else {
      return false;
    }
  };

  interface IComplexTypeSignature {
    iface: string;
    isPartial: boolean;
    name: string;
  }
  interface IReturnType {
    isFragment: boolean;
    isPartial: boolean;
    iface: string;
    complexTypes: IComplexTypeSignature[];
  }

  const wrapPartial: (possiblePartial: IReturnType) => string = possiblePartial => {
    if (possiblePartial.isPartial) {
      return `Partial<${possiblePartial.iface}>`;
    } else {
      return possiblePartial.iface;
    }
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

  type ChildSelectionsType =
    (operation: OperationTypeNode, selection: SelectionNode, indentation: string, parent?: GraphQLType, isUndefined?: boolean)
      => IReturnType;

  const getChildSelections: ChildSelectionsType = (operation, selection, indentation= '', parent?, isUndefined= false): IReturnType => {
    let str: string = '';
    let field: GraphQLField<any, any>;
    let isFragment: boolean = false;
    let isPartial: boolean = false;
    let generatedTypeCount: number = 0;
    let complexTypes: IComplexTypeSignature[] = [];

    if (selection.kind === 'Field') {
      if (parent && isCompositeType(parent)) {
        if (parent instanceof GraphQLUnionType) {
          field = parent.getTypes().map(t => t.getFields()[selection.name.value]).find(z => !!z)!;
        } else {
          field = parent.getFields()[selection.name.value];
        }
      } else {
        const operationFields: GraphQLObjectType = getOperationFields(operation);
        field = operationFields.getFields()[selection.name.value];
      }

      let selectionName: string = selection.name.value;
      if (selection.alias) {
        selectionName = selection.alias.value;
      }

      if (isUndefined || isUndefinedFromDirective(selection.directives)) {
        selectionName += '?';
      }

      str += indentation + selectionName + ': ';

      if (!!selection.selectionSet) {
        let newParent: GraphQLCompositeType | undefined;
        if (!field) { console.log(selection, newParent); }
        const fieldType: GraphQLNamedType = getNamedType(field.type);
        if (isCompositeType(fieldType)) {
          newParent = fieldType;
        }

        const selections: IReturnType[] =
          selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + '  ',  newParent));

        const nonFragments: IReturnType[] = selections.filter(s => !s.isFragment);
        const fragments: IReturnType[] = selections.filter(s => s.isFragment);
        const andOps: string[] = [];
        complexTypes.push(...selections.map(sel => sel.complexTypes).reduce((acc, arr) => { acc.push(...arr); return acc; }, []));

        if (nonFragments.length) {
          const nonPartialNonFragments: IReturnType[] = nonFragments.filter(nf => !nf.isPartial);
          const partialNonFragments: IReturnType[] = nonFragments.filter(nf => nf.isPartial);

          if (nonPartialNonFragments.length) {
            let builder: string = '';
            builder += '{\n';
            builder += nonPartialNonFragments.map(f => f.iface).join('\n');
            builder += `\n${indentation}}`;
            andOps.push(builder);
            const newInterfaceName: string = `SelectionOn${selection.name.value}${!!generatedTypeCount ? generatedTypeCount : ''}`;
            generatedTypeCount += 1;
            complexTypes.push({ iface: builder, isPartial: false, name: newInterfaceName });
          }

          if (partialNonFragments.length) {
            let builder: string = '';
            builder += 'Partial<{\n';
            builder += partialNonFragments.map(f => f.iface).join('\n');
            builder += `\n${indentation}}>`;
            andOps.push(builder);
            const newInterfaceName: string = `SelectionOn${selection.name.value}${!!generatedTypeCount ? generatedTypeCount : ''}`;
            generatedTypeCount += 1;
            complexTypes.push({ iface: builder, isPartial: true, name: newInterfaceName });
          }
        }

        if (fragments.length) {
          andOps.push(...fragments.map(wrapPartial));
        }

        const childType: string = andOps.join(' & ');

        str += convertToType(field.type, false, childType) + ';';
      } else {
        if (!field) { console.log(selection); }
        str += convertToType(field.type) + ';';
      }
    } else if (selection.kind === 'FragmentSpread') {
      str = `IFragment${selection.name.value}`;
      isFragment = true;
      isPartial = isUndefinedFromDirective(selection.directives);
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      if (!anon) {
        const typeName: string = selection.typeCondition!.name.value;
        parent = parsedSchema.getType(typeName);
      }

      const selections: IReturnType[] =
        selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));

      let joinSelections: string = selections.map(s => s.iface).join('\n');
      isPartial = isUndefinedFromDirective(selection.directives);

      return {
        iface: joinSelections,
        isFragment,
        isPartial,
        complexTypes,
      };

    } else {
      throw new Error('Unsupported SelectionNode');
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
      return `${v.variable.name.value}${optional ? '?:' : ':'} ${convertVariable(v.type)};`;
    })
  );

  const variablesToInterface: (operationName: string, variables: VariableDefinitionNode[] | undefined) => string = (opName, variables) => {
    if (!variables || !variables.length) { return ''; }
    const variableTypeDefs: string[] = getVariables(variables);
    return options.formatVariableInterface(opName, variableTypeDefs);
  };

  return parsedSelection.definitions.map(def => {
    const ifaceName: string = options.buildRootInterfaceName(def);
    if (def.kind === 'OperationDefinition') {
      const variableInterface: string = variablesToInterface(ifaceName, def.variableDefinitions);
      const ret: IReturnType[] = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  '));
      const str: string[] = ret.map(x => x.iface);
      const iface: string = options.formatInterface(ifaceName, str);

      return {
        variables: variableInterface,
        interface: iface,
      };
    } else if (def.kind === 'FragmentDefinition') {
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType);
      let ret: IReturnType[] = def.selectionSet.selections.map(sel => getChildSelections('query', sel, '  ', foundType));
      let ext: string = ret.filter(x => x.isFragment).map(x => x.iface).join(', ');
      let opt: string = ext ? ` extends ${ext}` : '';
      let str: string[] = ret.filter(x => !x.isFragment).map(x => x.iface);
      const iface: string = formatFragmentInterface(ifaceName, str, opt);
      return {
        interface: iface,
        variables: ''
      };
    } else {
      console.error('unsupported definition');
      throw new Error(`Unsupported Definition ${def.kind}`);
    }
  });
};

export default doIt;
