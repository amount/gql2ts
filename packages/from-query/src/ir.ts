// tslint:disable max-line-length
import {
  GraphQLSchema,
  DocumentNode,
  FieldNode,
  InlineFragmentNode,
  VariableNode,
  TypeNode,
  OperationDefinitionNode,
  OperationTypeNode,
  SelectionNode,
  SelectionSetNode,
  NonNullTypeNode,
  ListTypeNode,
  GraphQLNamedType,
  GraphQLObjectType,
  getNamedType,
  isObjectType,
  GraphQLOutputType,
  isScalarType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isListType,
  isNonNullType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
  isInputObjectType,
  isLeafType,
  GraphQLString,
  GraphQLField,
  isAbstractType,
  FragmentSpreadNode,
  GraphQLInputType,
  GraphQLInterfaceType
} from 'graphql';
import * as util from 'util';

export interface IDirective {
  kind: 'Directive';
  name: string;
  arguments: Array<{ name: string; value: string }>;
}

export interface ITypeDefinition {
  kind: 'TypeDefinition';
  type: string;
  originalNode: TypeNode;
}

export interface INonNullTypeDefinition {
  kind: 'NonNullTypeDefinition';
  of: TypeDefinition;
  originalNode: GraphQLNonNull<any>;
}

export interface IListTypeDefinition {
  kind: 'ListTypeDefinition';
  of: TypeDefinition;
  originalNode: GraphQLList<any>;
}

export interface ITypenameDefinition {
  kind: 'TypenameDefinition';
  /**
   * This is the value of __typename
   */
  type: string | string[];
}

export type TypeDefinition =
  | ITypeDefinition
  | INonNullTypeDefinition
  | IListTypeDefinition
  | ITypenameDefinition;

export interface IFieldNode {
  kind: 'Field';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: FieldNode;
  selections: Selection[];
}

export interface ILeafNode {
  kind: 'LeafNode';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: FieldNode;
}

export interface ITypenameNode {
  kind: 'TypenameNode';
  typeDefinition: ITypenameDefinition;
}

export type FieldDefinition = IFieldNode | ILeafNode | ITypenameNode;

export interface IFragment {
  kind: 'Fragment';
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: InlineFragmentNode;
  selections: Selection[];
}

/**
 * EXPERIMENTAL
 * @TODO look at unions
 */
export interface IInterfaceNode {
  kind: 'InterfaceNode';
  name: string;
  fragments: IFragment[];
}

export type Selection = FieldDefinition | IInterfaceNode;

export interface IVariable {
  kind: 'Variable';
  name: string;
  type: TypeDefinition;
  originalNode: VariableNode;
}

export interface IInteralRepresentation {
  kind: 'Root';
  operationType: OperationTypeNode;
  name?: string;
  variables: IVariable[];
  directives: IDirective[];
  selections: Selection[];
}

const convertOutputType: (
  type: GraphQLOutputType | GraphQLInputType
) => TypeDefinition = type => {
  if (isScalarType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else if (isObjectType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else if (isInterfaceType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else if (isUnionType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else if (isEnumType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else if (isListType(type)) {
    return {
      kind: 'ListTypeDefinition',
      of: convertOutputType(type.ofType),
      originalNode: null!
    };
  } else if (isNonNullType(type)) {
    return {
      kind: 'NonNullTypeDefinition',
      of: convertOutputType(type.ofType),
      originalNode: null!
    };
  } else if (isInputObjectType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      type: type.name
    };
  } else {
    throw new Error(`Unsupported Type: ${type}`);
  }
};

const extractSelections: (
  selectionSet: SelectionSetNode | undefined
) => ReadonlyArray<SelectionNode> = selectionSet =>
  selectionSet ? [...selectionSet.selections] : [];

const convertFieldNodeToIR: (
  fieldNode: FieldNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
) => FieldDefinition = (fieldNode, nodeType, schema) => {
  const fieldName: string = fieldNode.name.value;

  if (fieldName === '__typename') {
    return {
      kind: 'TypenameNode',
      typeDefinition: {
        kind: 'TypenameDefinition',
        type: isAbstractType(nodeType)
          ? schema.getPossibleTypes(nodeType).map(x => x.name)
          : nodeType.name
      }
    };
  }

  // if (isInterfaceType(nodeType)) {
  //   return convertInterfaceToExpandedFragmentIR(fieldNode, nodeType, schema) as any;
  // }

  if (fieldName.startsWith('__')) {
    throw new Error('introspection not supported yet');
  }

  const field: GraphQLField<any, any> | null =
    isObjectType(nodeType) || isInterfaceType(nodeType)
      ? nodeType.getFields()[fieldName]
      : null;
  const underlyingType: GraphQLOutputType | null = field!.type;
  const resolvedName: string = fieldNode.alias
    ? fieldNode.alias.value
    : fieldName;

  if (isLeafType(getNamedType(underlyingType!))) {
    return {
      kind: 'LeafNode',
      name: resolvedName,
      originalNode: null!, // field
      directives: [],
      typeDefinition: convertOutputType(underlyingType)
    };
  }

  return {
    kind: 'Field',
    name: resolvedName,
    originalNode: null!, // field,
    typeDefinition: convertOutputType(underlyingType),
    selections: underlyingType
      ? collectSelectionsFromNode(
          extractSelections(fieldNode.selectionSet),
          getNamedType(underlyingType),
          schema
        )
      : [],
    directives: []
  };
};

const convertInlineFragmentToIR: (
  selection: InlineFragmentNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
) => IFragment = (selection, _nodeType, schema) => {
  if (!selection.typeCondition) {
    throw new Error('Inline Fragments Must Be Flattened!');
  }

  const typeConditionNode: GraphQLNamedType | undefined | null = schema.getType(selection.typeCondition.name.value);

  if (!typeConditionNode) {
    throw new Error('Requested Fragment Not Found!');
  }

  return {
    directives: [],
    kind: 'Fragment',
    originalNode: null!,
    selections: collectSelectionsFromNode(
      extractSelections(selection.selectionSet),
      schema.getType(selection.typeCondition!.name.value)!,
      schema
    ),
    typeDefinition: convertOutputType(typeConditionNode),
  };
};

const convertInterfaceToExpandedFragmentIR: (
  selection: FieldNode,
  nodeType: GraphQLInterfaceType,
  schema: GraphQLSchema
) => IInterfaceNode = (selection, nodeType, schema) => {
  const possibleTypes: ReadonlyArray<GraphQLObjectType> = schema.getPossibleTypes(nodeType);
  const possibleTypeMap: { [type: string]: InlineFragmentNode[] } = possibleTypes.reduce((acc, type) => ({ ...acc, [type.name]: [] }), {});
  if (!selection.selectionSet) {
    throw new Error('Invalid Selection on Interface');
  }

  const [commonFields, _fragments] = selection.selectionSet.selections.reduce<[FieldNode[], InlineFragmentNode[]]>(
    ([fields, inline], sel) => {
      if (sel.kind === 'Field') { return [fields.concat(sel), inline]; }
      if (sel.kind === 'InlineFragment') {
        possibleTypeMap[sel.typeCondition!.name.value].push(sel);
        return [fields, inline.concat(sel)];
      }

      throw new Error('Invalid FragmentSpread found encountered!');
    },
    [[], []]
  );

  const collectedTypeMap: {[type: string]: Selection[]} = Object.keys(possibleTypeMap).reduce<{[type: string]: Selection[]}>(
    (acc, type) => ({
      ...acc,
      [type]: collectSelectionsFromNode(
        [
          ...commonFields,
          ...possibleTypeMap[type].reduce<SelectionNode[]>((sels, field) => sels.concat(field.selectionSet.selections), [])
        ],
        schema.getType(type)!,
        schema
      )
    }),
    {}
  );

  return {
    kind: 'InterfaceNode',
    name: selection.name.value,
    fragments: Object.entries(collectedTypeMap).map<IFragment>(([key, value]) => ({
      kind: 'Fragment',
      directives: [],
      originalNode: null!,
      selections: value,
      typeDefinition: convertOutputType(schema.getType(key)!)
    }))
  };
};

const convertSelectionToIR: (
  selection: SelectionNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema,
) => Selection = (selection, nodeType, schema) => {
  if (isObjectType(nodeType) && selection.kind === 'Field') {
    const possibleInterface: GraphQLField<any, any> | undefined = nodeType.getFields()[selection.name.value];
    if (possibleInterface && possibleInterface.type && isInterfaceType(possibleInterface.type)) {
      return convertInterfaceToExpandedFragmentIR(selection, possibleInterface.type, schema);
    }
  }

  switch (selection.kind) {
    case 'Field':
      return convertFieldNodeToIR(selection, nodeType, schema);
    case 'FragmentSpread':
      throw new Error('Fragment Spreads Must Be Inlined!');
    case 'InlineFragment':
      // return convertInterfaceToExpandedFragmentIR(selection, nodeType, schema, parent);
      // return convertInlineFragmentToIR(selection, nodeType, schema) as any;
    default:
      return null!;
  }
};

const collectSelectionsFromNode: (
  selections: ReadonlyArray<SelectionNode>,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema,
) => Selection[] = (selections, nodeType, schema) =>
  selections.map(selection =>
    convertSelectionToIR(selection, nodeType, schema)
  );

const getOperationFields: (
  schema: GraphQLSchema,
  operation: OperationTypeNode
) => GraphQLObjectType | null | undefined = (schema, operation) => {
  switch (operation) {
    case 'mutation':
      return schema.getMutationType();
    case 'subscription':
      return schema.getSubscriptionType();
    case 'query':
    default:
      return schema.getQueryType();
  }
};

const convertToIr: (
  schema: GraphQLSchema,
  query: DocumentNode
) => IInteralRepresentation = (schema, query) => {
  const def: OperationDefinitionNode = query
    .definitions[0] as OperationDefinitionNode;

  const operationType:
    | GraphQLObjectType
    | null
    | undefined = getOperationFields(schema, def.operation);

  if (!operationType) {
    throw new Error('unsupported operation');
  }
  const returnVal: IInteralRepresentation = {
    kind: 'Root',
    operationType: def.operation,
    name: def.name ? def.name.value : undefined,
    variables: [],
    directives: [],
    selections: collectSelectionsFromNode(
      def.selectionSet.selections,
      operationType,
      schema,
    )
  };

  return returnVal;
};

export default convertToIr;
