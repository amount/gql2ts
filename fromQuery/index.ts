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

  const TypeMap: { [x: string]: string | undefined } = Object.assign({
    ID: 'string',
    String: 'string',
    Boolean: 'boolean',
    Float: 'number',
    Int: 'number',
  }, typeMap);

  const convertVariable = (type: TypeNode, isNonNull: boolean= false, replacement: string | null= null): string => {
    if (type.kind === 'ListType') {
      return wrapList(convertVariable(type.type, false, replacement)) + (isNonNull ? '' : ' | null');
    } else if (type.kind === 'NonNullType') {
      return convertVariable(type.type, true, replacement)
    } else {
      if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
        const newType: GraphQLType = parsedSchema.getType(type.name.value)
        if (newType instanceof GraphQLEnumType) {
          const decl: string = newType.getValues().map(en => `'${en.value}'`).join(' | ');
          return isNonNull ? decl : `${decl} | null`;
        }
      }
      const showValue: string = replacement ? replacement : type.name.value;
      const show: string = TypeMap[showValue] || (replacement ? showValue : 'any');
      return isNonNull ? show : `${show} | null`;
    }
  }

  const convertToType = (type: GraphQLOutputType, isNonNull: boolean= false, replacement: string | null= null): string => {
    if (isList(type)) {
      return wrapList(convertToType(type.ofType, false, replacement)) + (isNonNull ? '' : ' | null');
    } else if (isNonNullable(type)) {
      return convertToType(type.ofType, true, replacement)
    } else if (type instanceof GraphQLEnumType) {
      const types: string = type.getValues().map(en => `'${en.value}'`).join(' | ');
      return isNonNull ? types : `${types} | null`;
    } else {
      const showValue: string = replacement ? replacement : type.toString();
      const show: string = TypeMap[showValue] || (replacement ? showValue : 'any');
      return isNonNull ? show : `${show} | null`;
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

  interface IReturnType {
    isFragment: boolean;
    isPartial: boolean;
    iface: string;
  }

  const wrapPartial = (possiblePartial: IReturnType) => {
    if (possiblePartial.isPartial) {
      return `Partial<${possiblePartial.iface}>`;
    } else {
      return possiblePartial.iface;
    }
  }

  const getChildSelections = (operation: OperationTypeNode, selection: SelectionNode, indentation: string = '', parent?: GraphQLType, isUndefined: boolean= false): IReturnType => {
    let str: string = '';
    let field: GraphQLField<any, any>;
    let isFragment: boolean = false;
    let isPartial: boolean = false;
    if (selection.kind === 'Field') {
      if (parent) {
        field = (parent as any).getFields()[selection.name.value];
      } else {
        let operationFields: GraphQLObjectType | undefined;
        switch (operation) {
          case 'query':
            operationFields = parsedSchema.getQueryType();
            break;
          case 'mutation':
            operationFields = parsedSchema.getMutationType();
            break;
          case 'subscription':
            operationFields = parsedSchema.getSubscriptionType();
            break;
          default:
            throw new Error('Unsupported Operation');
        }
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

        if (nonFragments.length) {
          const nonPartialNonFragments = nonFragments.filter(nf => !nf.isPartial);
          const partialNonFragments = nonFragments.filter(nf => nf.isPartial);

          if (nonPartialNonFragments.length) {
            let builder: string = '';
            builder += '{\n';
            builder += nonPartialNonFragments.map(f => f.iface).join('\n');
            builder += `\n${indentation}}`;
            andOps.push(builder);
          }

          if (partialNonFragments.length) {
            let builder: string = '';
            builder += 'Partial<{\n';
            builder += partialNonFragments.map(f => f.iface).join('\n');
            builder += `\n${indentation}}>`;
            andOps.push(builder);
          }
        }

        if (fragments.length) {
          andOps.push(...fragments.map(wrapPartial));
        }

        const childType = andOps.join(' & ');

        str += convertToType(field.type, false, childType) + ';';
      } else {
        if (!field) { console.debug(selection); }
        str += convertToType(field.type) + ';';
      }
    } else if (selection.kind === 'FragmentSpread') {
      str = `IFragment${selection.name.value}`
      isFragment = true;
      if (isUndefinedFromDirective(selection.directives)) {
        isPartial = true;
      }
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      if (!anon) {
        const typeName = selection.typeCondition!.name.value;
        parent = parsedSchema.getType(typeName);
      }

      const selections: IReturnType[] = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));
      let joinSelections: string = selections.map(s => s.iface).join('\n');
      if (isUndefinedFromDirective(selection.directives)) {
        isPartial = true
      }
      return {
        iface: joinSelections,
        isFragment,
        isPartial
      };

    } else {
      console.error('Unsupported SelectionNode');
    }
    return {
      iface: str,
      isFragment,
      isPartial
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
      let str = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  ')).map(x => x.iface);
      iface += str.join('\n');
      iface += `\n}`;

      return {
        variables: variableInterface,
        interface: iface,
      }
    } else if (def.kind === 'FragmentDefinition') {
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType);
      let str = def.selectionSet.selections.map(sel => getChildSelections('query', sel, '  ', foundType)).map(x => x.iface);
      let iface = `export interface IFragment${def.name.value} {
${str}
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
