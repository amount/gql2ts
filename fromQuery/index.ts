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
} from 'graphql';

const doIt = (schema: GraphQLSchema | string, selection: string, typeMap: object = {}) => {
  const parsedSchema: GraphQLSchema = (schema instanceof GraphQLSchema) ? schema : buildSchema(schema);
  const parsedSelection: DocumentNode = parse(selection);

  function isNonNullable(type: GraphQLType): type is GraphQLNonNull<any> {
    return type instanceof GraphQLNonNull;
  };

  function isList(type: GraphQLType): type is GraphQLList<any> {
    return type instanceof GraphQLList;
  };

  const wrapList = (type: string): string => `Array<${type}>`;

  const TypeMap: { [x: string]: string | undefined } = {
    ID: 'string',
    String: 'string',
    Boolean: 'boolean',
    Float: 'number',
    Int: 'number',
    ...typeMap
  };

  const printType = (type: string, isNonNull: boolean) => isNonNull ? type : `${type} | null`;

  const handleInputObject = (type: GraphQLInputObjectType, isNonNull: boolean) => {
    const variables: GraphQLInputField[] = Object.keys(type.getFields()).map(k => type.getFields()[k])
    const builder: string = `{\n${variables.map(v => `    ${v.name}?: ${convertToType(v.type)};`).join('\n')}\n  }`;
    return printType(builder, isNonNull);
  }

  const handleEnum = (type: GraphQLEnumType, isNonNull) => {
    const decl: string = type.getValues().map(en => `'${en.value}'`).join(' | ');
    return printType(decl, isNonNull);
  }

  const handleNamedTypeInput = (type: TypeNode, isNonNull: boolean) => {
    if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
      const newType: GraphQLType = parsedSchema.getType(type.name.value)
      if (newType instanceof GraphQLEnumType) {
        return handleEnum(newType, isNonNull);
      } else if (newType instanceof GraphQLInputObjectType) {
        return handleInputObject(newType, isNonNull);
      }
    }
  }

  const handleRegularType = (type: NamedTypeNode | GraphQLNamedType, isNonNull: boolean, replacement: string | null) => {
    const typeValue: string = (typeof type.name === 'string') ? type.toString() : type.name.value;
    const showValue: string = replacement ? replacement : typeValue;
    const show: string = TypeMap[showValue] || (replacement ? showValue : 'any');
    return printType(show, isNonNull);
  }

  const convertVariable = (type: TypeNode, isNonNull: boolean= false, replacement: string | null= null): string => {
    if (type.kind === 'ListType') {
      return wrapList(convertVariable(type.type, false, replacement)) + printType('', isNonNull);
    } else if (type.kind === 'NonNullType') {
      return convertVariable(type.type, true, replacement)
    } else {
      return handleNamedTypeInput(type, isNonNull) || handleRegularType(type, isNonNull, replacement);
    }
  }

  const convertToType = (type: GraphQLOutputType | GraphQLInputType, isNonNull: boolean= false, replacement: string | null= null): string => {
    if (isList(type)) {
      return wrapList(convertToType(type.ofType, false, replacement)) + printType('', isNonNull);
    } else if (isNonNullable(type)) {
      return convertToType(type.ofType, true, replacement)
    } else if (type instanceof GraphQLEnumType) {
      return handleEnum(type, isNonNull);
    } else {
      return handleRegularType(type, isNonNull, replacement);
    }
  }

  const UndefinedDirectives: Set<string> = new Set(['include', 'skip']);

  const isUndefinedFromDirective = (directives: DirectiveNode[] | undefined): boolean => {
    if (!directives || !directives.length) { return false; }

    const badDirectives: DirectiveNode[] = directives.filter(d => !UndefinedDirectives.has(d.name.value));
    const hasDirectives: boolean = directives.some(d => UndefinedDirectives.has(d.name.value));

    if (badDirectives.length) {
      console.error('Found some unknown directives:');
      badDirectives.forEach(d => console.error(d.name.value))
    }

    if (hasDirectives) {
      return true;
    } else {
      return false;
    }
  }

  interface ComplexTypeSignature {
    iface: string;
    isPartial: boolean;
    name: string;
  }
  interface IReturnType {
    isFragment: boolean;
    isPartial: boolean;
    iface: string;
    complexTypes: ComplexTypeSignature[];
  }

  const wrapPartial = (possiblePartial: IReturnType) => {
    if (possiblePartial.isPartial) {
      return `Partial<${possiblePartial.iface}>`;
    } else {
      return possiblePartial.iface;
    }
  }

  const getOperationFields = (operation: OperationTypeNode) => {
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
  }

  const getChildSelections = (operation: OperationTypeNode, selection: SelectionNode, indentation: string = '', parent?: GraphQLType, isUndefined: boolean= false): IReturnType => {
    let str: string = '';
    let field: GraphQLField<any, any>;
    let isFragment: boolean = false;
    let isPartial: boolean = false;
    let generatedTypeCount: number = 0;
    let complexTypes: ComplexTypeSignature[] = [];

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
        let parent: GraphQLCompositeType | undefined;
        if (!field) { console.log(selection, parent); }
        const fieldType = getNamedType(field.type);
        if (isCompositeType(fieldType)) {
          parent = fieldType;
        }

        const selections: IReturnType[] = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + '  ',  parent));
        const nonFragments: IReturnType[] = selections.filter(s => !s.isFragment);
        const fragments: IReturnType[] = selections.filter(s => s.isFragment);
        const andOps: string[] = [];
        complexTypes.push(...selections.map(sel => sel.complexTypes).reduce((acc, arr) => { acc.push(...arr); return acc; }, []));

        if (nonFragments.length) {
          const nonPartialNonFragments = nonFragments.filter(nf => !nf.isPartial);
          const partialNonFragments = nonFragments.filter(nf => nf.isPartial);

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

        const childType = andOps.join(' & ');

        str += convertToType(field.type, false, childType) + ';';
      } else {
        if (!field) { console.log(selection); }
        str += convertToType(field.type) + ';';
      }
    } else if (selection.kind === 'FragmentSpread') {
      str = `IFragment${selection.name.value}`
      isFragment = true;
      isPartial = isUndefinedFromDirective(selection.directives)
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      if (!anon) {
        const typeName = selection.typeCondition!.name.value;
        parent = parsedSchema.getType(typeName);
      }

      const selections: IReturnType[] = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));
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
  }

  const getVariables = (variables: VariableDefinitionNode[]) => {
    return variables.map(v => {
      const optional: boolean = v.type.kind !== 'NonNullType';
      return `${v.variable.name.value}${optional ? '?:' : ':'} ${convertVariable(v.type)};`;
    })
  }

  return parsedSelection.definitions.map(def => {
    if (def.kind === 'OperationDefinition') {
      const name = def.name ? def.name.value : 'Anonymous';
      let variableInterface = '';
      let iface = '';
      if (def.variableDefinitions && !!def.variableDefinitions.length) {
        const variables: string[] = getVariables(def.variableDefinitions);
        variableInterface = `export interface ${name}Input {
  ${variables.join('\n  ')}
}`;
      }
      iface += `export interface ${name} {\n`;
      let ret: IReturnType[] = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  '));
      let str: string[] = ret.map(x => x.iface)
      iface += str.join('\n');
      iface += `\n}`;

      return {
        variables: variableInterface,
        interface: iface,
      }
    } else if (def.kind === 'FragmentDefinition') {
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType);
      let ret: IReturnType[] = def.selectionSet.selections.map(sel => getChildSelections('query', sel, '  ', foundType))
      let str: string[] = ret.map(x => x.iface);
      let iface = `export interface IFragment${def.name.value} {
${str.join('\n')}
}`;
      return {
        interface: iface,
        variables: ''
      }
    } else {
      console.error('unsupported definition');
    }
  })
}

export default doIt;
