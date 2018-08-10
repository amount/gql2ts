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
  GraphQLInputType
} from 'graphql';
import * as util from 'util';

interface IDirective {
  kind: 'Directive';
  name: string;
  arguments: Array<{ name: string; value: string }>;
}

interface ITypeDefinition {
  kind: 'TypeDefinition';
  type: string;
  originalNode: TypeNode;
}

interface INonNullTypeDefinition {
  kind: 'NonNullTypeDefinition';
  of: TypeDefinition;
  originalNode: GraphQLNonNull<any>;
}

interface IListTypeDefinition {
  kind: 'ListTypeDefinition';
  of: TypeDefinition;
  originalNode: GraphQLList<any>;
}

interface ITypenameDefinition {
  kind: 'TypenameDefinition';
  /**
   * This is the value of __typename
   */
  type: string | string[];
}

type TypeDefinition =
  | ITypeDefinition
  | INonNullTypeDefinition
  | IListTypeDefinition
  | ITypenameDefinition;

interface IFieldNode {
  kind: 'Field';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: FieldNode;
  selections: Selection[];
}

interface ILeafNode {
  kind: 'LeafNode';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: FieldNode;
}

interface ITypenameNode {
  kind: 'TypenameNode';
  typeDefinition: ITypenameDefinition;
}

type FieldDefinition = IFieldNode | ILeafNode | ITypenameNode;

interface IFragment {
  kind: 'Fragment';
  typeDefinition: TypeDefinition;
  directives: IDirective[];
  originalNode: InlineFragmentNode;
  selections: Selection[];
}

type Selection = FieldDefinition | IFragment;

interface IVariable {
  kind: 'Variable';
  name: string;
  type: TypeDefinition;
  originalNode: VariableNode;
}

interface IInteralRepresentation {
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

const convertFragmentSpreadToIR: (
  selection: FragmentSpreadNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
) => IFragment = (_selection, _nodeType, _schema) => {
  if (0) {
    return 'fragmentspread' as any;
  }
  return 'fragmentspread' as any;
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

const convertSelectionToIR: (
  selection: SelectionNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
) => Selection = (selection, nodeType, schema) => {
  switch (selection.kind) {
    case 'Field':
      return convertFieldNodeToIR(selection, nodeType, schema);
    case 'FragmentSpread':
      return convertFragmentSpreadToIR(selection, nodeType, schema);
    case 'InlineFragment':
      return convertInlineFragmentToIR(selection, nodeType, schema);
    default:
      return null!;
  }
};

const collectSelectionsFromNode: (
  selections: ReadonlyArray<SelectionNode>,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
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
  console.log(schema, query);

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
      schema
    )
  };

  console.log(util.inspect(returnVal, undefined, Infinity, true));

  return returnVal;
};

export default convertToIr;
