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

  const getChildSelections = (operation: OperationTypeNode, selection: SelectionNode, indentation: string = '', parent?: GraphQLType, isUndefined?: boolean= false) => {
    let str: string = '';
    let field: GraphQLField<any, any>;

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

      if (isUndefined) {
        selectionName += '?';
      }

      str += indentation + selectionName + ': ';

      if (!!selection.selectionSet) {
        let parent: GraphQLCompositeType | undefined;
        const fieldType = getNamedType(field.type);
        if (isCompositeType(fieldType)) {
          parent = fieldType;
        }
        let childType = '{';
        const selections: string[] = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + '  ',  parent));
        const fragments: string[] = selections.filter(s => !s.trim().startsWith('IFragment'));
        const nonfragments: string [] = selections.filter(s => s.trim().startsWith('IFragment'));
        if (fragments.length) {
          childType += '\n';
          childType += fragments.join('\n');
          childType += '\n' + indentation;
        }
        childType += '}';
        if (nonfragments.length) {
          childType += ' & ' + nonfragments.join(' & ');
        }

        str += convertToType(field.type, false, childType) + ';';
      } else {
        if (!field) { console.log(selection); }
        str += convertToType(field.type) + ';';
      }
    } else if (selection.kind === 'FragmentSpread') {
      str = `IFragment${selection.name.value}`
    } else if (selection.kind === 'InlineFragment') {
      const anon: boolean = !selection.typeCondition;
      if (!anon) {
        const typeName = selection.typeCondition!.name.value;
        parent = parsedSchema.getType(typeName);
      }
      const selections: string[] = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));
      return selections.join('\n');
    } else {
      console.error('unsupported');
    }
    return str;
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
      let str = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  '));
      iface += str.join('\n');
      iface += `\n}`;

      return {
        variables: variableInterface,
        interface: iface,
      }
    } else if (def.kind === 'FragmentDefinition') {
      const onType: string = def.typeCondition.name.value;
      const foundType: GraphQLType = parsedSchema.getType(onType);
      let str = def.selectionSet.selections.map(sel => getChildSelections('query', sel, '  ', foundType));
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
