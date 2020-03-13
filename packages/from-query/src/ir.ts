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
  isInputObjectType,
  isLeafType,
  GraphQLField,
  isAbstractType,
  GraphQLInputType,
  GraphQLInterfaceType,
  DirectiveNode,
  GraphQLType,
  isNamedType,
  GraphQLEnumType,
  VariableDefinitionNode
} from 'graphql';

/**
 * An internal representation for a Directive, has the name and
 * a map of the arguments provided
 */
export interface IDirective {
  kind: 'Directive';
  name: string;
  arguments: { [name: string]: string; };
}

/**
 * A map of directive name to Directive IR
 */
export interface IDirectiveMap {
  [directive: string]: IDirective;
}

/**
 * A type definition for a Scalar
 */
export interface ITypeDefinition {
  kind: 'TypeDefinition';
  type: string;
  nullable: boolean;
  originalNode: TypeNode;
  isScalar: boolean;
}

/**
 * A type definition for a List
 */
export interface IListTypeDefinition {
  kind: 'ListTypeDefinition';
  of: TypeDefinition;
  nullable: boolean;
  originalNode: GraphQLList<any>;
}

/**
 * A definition for a __typename declaration
 */
export interface ITypenameDefinition {
  kind: 'TypenameDefinition';
  nullable: false;
  /**
   * This is the value of __typename
   */
  type: string | string[];
}

export interface IInterfaceTypeDefinition {
  kind: 'InterfaceTypeDefinition';
  nullable: boolean;
  originalNode: GraphQLInterfaceType;
}

export interface IEnumTypeDefinition {
  kind: 'EnumTypeDefinition';
  nullable: boolean;
  originalNode: GraphQLEnumType;
  type: string;
  values: string[];
}

/**
 * The possible type definitions
 */
export type TypeDefinition =
  | ITypeDefinition
  | IInterfaceTypeDefinition
  // | INonNullTypeDefinition
  | IListTypeDefinition
  | ITypenameDefinition
  | IEnumTypeDefinition;

/**
 * An internal representation for a FieldNode. This represents an
 * object, its selections and its type definition
 */
export interface IFieldNode {
  kind: 'Field';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirectiveMap;
  originalNode: FieldNode;
  selections: Selection[];
}

/**
 * An internal representation for a LeafNode. This represents a Scalar and its
 * type definition
 */
export interface ILeafNode {
  kind: 'LeafNode';
  name: string;
  typeDefinition: TypeDefinition;
  directives: IDirectiveMap;
  originalNode: FieldNode;
}

/**
 * An internal representation for a `__typename` selection
 */
export interface ITypenameNode {
  kind: 'TypenameNode';
  typeDefinition: ITypenameDefinition;
  name: string;
}

/**
 * A possible field definition
 */
export type FieldDefinition = IFieldNode | ILeafNode | ITypenameNode;

/**
 * An internal representation for a Fragment definition. This is used
 * by an {@link IInterfaceNode} object
 */
export interface IFragment {
  kind: 'Fragment';
  typeDefinition: TypeDefinition;
  directives: IDirectiveMap;
  originalNode: InlineFragmentNode;
  selections: Selection[];
}

/**
 * This represents a selection on an interface, it contains a list of
 * {@link IFragment} objects.
 *
 * EXPERIMENTAL
 * @TODO look at unions
 */
export interface IInterfaceNode {
  kind: 'InterfaceNode';
  name: string;
  fragments: IFragment[];
  directives: IDirectiveMap;
  typeDefinition: TypeDefinition;
}

/**
 * A Selection on an object
 */
export type Selection = FieldDefinition | IInterfaceNode;

/**
 * An internal representation of a Variable
 */
export interface IVariable {
  kind: 'Variable';
  name: string;
  type: TypeDefinition;
  originalNode: VariableNode;
}

/**
 * An internal representation of an operation
 */
export interface IOperation {
  kind: 'Root';
  operationType: OperationTypeNode;
  name?: string;
  variables: IVariable[];
  directives: IDirectiveMap;
  selections: Selection[];
}

/**
 * Given an Array of DirectiveNodes, return a map of directive names to their IR
 *
 * @param directives The directives provided by the AST
 * @returns A map of directives
 */
const extractDirectives: (
  directives?: ReadonlyArray<DirectiveNode>
) => IDirectiveMap = directives => !directives ? {} : directives.reduce<IDirectiveMap>(
  (directiveMap, { name: { value: name }, arguments: args = [] }) => ({
    ...directiveMap,
    [name]: {
      kind: 'Directive',
      name,
      // @TODO support all of ValueNode
      arguments: args.reduce<IDirective['arguments']>(
        (acc, val) => ({ ...acc, [val.name.value]: val.value.kind === 'StringValue' ? val.value.value : val.value.toString() }),
        {}
      )
    }
  }),
  {}
);

/**
 * Given a potentially wrapping type, return the unwrapped type
 *
 * @param type A GraphQLType
 * @returns A GraphQLNamedType (i.e. a type without List or NonNull)
 */
export const unwrapType: (type: GraphQLType) => GraphQLNamedType = type => {
  if (isNamedType(type)) { return type; }
  return unwrapType(type.ofType);
};

/**
 * This takes a {@link GraphQLOutputType} or {@link GraphQLInputType} and
 * returns an IR TypeDefinition. In the case of a wrapping type (List/NonNull),
 * this function will recurse.
 *
 * @param type The GraphQL Type
 * @returns An IR TypeDefinition
 */
const convertTypeToIR: (
  type: GraphQLOutputType | GraphQLInputType,
  nonNull?: boolean
) => TypeDefinition = (type, nonNull = false) => {
  if (isScalarType(type)) {
    return {
      kind: 'TypeDefinition',
      nullable: !nonNull,
      originalNode: null!,
      type: type.name,
      isScalar: true,
    };
  } else if (isObjectType(type)) {
    return {
      kind: 'TypeDefinition',
      nullable: !nonNull,
      originalNode: null!,
      type: type.name,
      isScalar: false,
    };
  } else if (isInterfaceType(type)) {
    return {
      kind: 'InterfaceTypeDefinition',
      nullable: !nonNull,
      originalNode: null!,
    };
  } else if (isUnionType(type)) {
    return {
      kind: 'TypeDefinition',
      nullable: !nonNull,
      originalNode: null!,
      type: type.name,
      isScalar: false,
    };
  } else if (isEnumType(type)) {
    return {
      kind: 'EnumTypeDefinition',
      nullable: !nonNull,
      originalNode: null!,
      type: type.name,
      values: type.getValues().map(value => value.value)
    };
  } else if (isListType(type)) {
    return {
      kind: 'ListTypeDefinition',
      of: convertTypeToIR(type.ofType),
      nullable: !nonNull,
      originalNode: null!
    };
  } else if (isNonNullType(type)) {
    return convertTypeToIR(type.ofType, true);
  } else if (isInputObjectType(type)) {
    return {
      kind: 'TypeDefinition',
      originalNode: null!,
      nullable: !nonNull,
      type: type.name,
      isScalar: false
    };
  } else {
    throw new Error(`Unsupported Type: ${type}`);
  }
};

/**
 * Given a SelectionSetNode, return a list of SelectionNodes
 * @param selectionSet A field's selection set
 * @returns An array of SelectionNodes
 */
const extractSelections: (
  selectionSet: SelectionSetNode | undefined
) => ReadonlyArray<SelectionNode> = selectionSet =>
  selectionSet ? [...selectionSet.selections] : [];

/**
 * Converts a FieldNode into the FieldDefinition IR
 *
 * This supports converting into a:
 *  - ITypenameNode (a `__typename` selection)
 *  - ILeafNode (a scalar selection)
 *  - IFieldNode (an object type)
 *
 * If we encounter a FieldNode selection, we recurse over its selection set
 *
 * @param fieldNode A FieldNode selection
 * @param nodeType The {@link GraphQLNamedType} that the selection belongs to
 * @param schema The GraphQL Schema
 * @returns The FieldDefinition IR
 */
const convertFieldNodeToIR: (
  fieldNode: FieldNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema
) => FieldDefinition = (fieldNode, nodeType, schema) => {
  const fieldName: string = fieldNode.name.value;

  /**
   * `__typename` (and other introspection fields) are special. They
   * don't exist on the actual `GraphQLNamedType`. Additionally,
   * `__typename` should be more than just a String type; it should be
   * the type's name.
   */
  if (fieldName === '__typename') {
    return {
      kind: 'TypenameNode',
      typeDefinition: {
        kind: 'TypenameDefinition',
        nullable: false,
        type: isAbstractType(nodeType)
          ? schema.getPossibleTypes(nodeType).map(x => x.name)
          : nodeType.name
      },
      name: fieldNode.alias ? fieldNode.alias.value : '__typename'
    };
  }

  // @TODO support introspection fields
  if (fieldName.startsWith('__')) {
    throw new Error('introspection not supported yet');
  }

  // Collect the field from the Type using the field's name
  const field: GraphQLField<any, any> | null =
    isObjectType(nodeType) || isInterfaceType(nodeType)
      ? nodeType.getFields()[fieldName]
      : null;

  // Get the underlying type of the field we're looking at
  const underlyingType: GraphQLOutputType | null = field!.type;
  const resolvedName: string = fieldNode.alias
    ? fieldNode.alias.value
    : fieldName;

  if (isLeafType(getNamedType(underlyingType!))) {
    return {
      kind: 'LeafNode',
      name: resolvedName,
      originalNode: null!,
      directives: extractDirectives(fieldNode.directives),
      typeDefinition: convertTypeToIR(underlyingType)
    };
  }

  return {
    kind: 'Field',
    name: resolvedName,
    originalNode: null!,
    typeDefinition: convertTypeToIR(underlyingType),
    selections: underlyingType
      ? collectSelectionsFromNode(
          extractSelections(fieldNode.selectionSet),
          getNamedType(underlyingType),
          schema
        )
      : [],
    directives: extractDirectives(fieldNode.directives)
  };
};

/**
 * This function takes a FieldNode of type {@link GraphQLInterfaceType} and converts it into
 * an {@link IInterfaceNode} type.
 *
 * Imagine a query like:
 *
 * ```graphql
 *  query GetStuffFromInterface {
 *    interfaceSelection {
 *      __typename
 *      id
 *
 *      ... on TypeA {
 *        fieldA
 *      }
 *
 *      # No Selection on TypeB
 *
 *      ... on TypeC {
 *        fieldC
 *      }
 *    }
 *  }
 * ```
 *
 * The field `interfaceSelection` is an interface which is implemented by `TypeA`, `TypeB`, and `TypeC`.
 *
 * In this case the `selection` parameter would be the `interfaceSelection` `FieldNode` and nodeType would be of
 * type `InterfaceSelection` (or whatever it is in the schema).
 *
 * This function will:
 *  1. Collect all of the common field selections (in this case: `__typename` & `id`)
 *  2. Collect the unique fields per type (in this case, more or less: `{ TypeA: [fieldA], TypeB: [], TypeC: [fieldC] }`)
 *  3. Expand the fragment selections into all of the possible implementing types (in this case: TypeA, TypeB, TypeC)
 *  4. Combine the common fields & unique field selections for each implementing type
 *
 * This will essentially transform the above query into:
 *
 * ```graphql
 *  query GetStuffFromInterface {
 *    interfaceSelection { *
 *      ... on TypeA {
 *        __typename
 *        id
 *        fieldA
 *      }
 *
 *      # TypeB Selection now exists
 *      ... on TypeB {
 *        __typename
 *        id
 *      }
 *
 *      ... on TypeC {
 *        __typename
 *        id
 *        fieldC
 *      }
 *    }
 *  }
 * ```
 *
 *
 * @param selection A FieldNode of type {@link GraphQLInterfaceType}
 * @param nodeType The {@link GraphQLInterfaceType} that the selection belongs to
 * @param schema The GraphQL Schema
 * @returns An IR node for an InterfaceNode
 */
const convertInterfaceToInterfaceIR: (
  selection: FieldNode,
  nodeType: GraphQLInterfaceType,
  schema: GraphQLSchema
) => IInterfaceNode = (selection, nodeType, schema) => {
  if (!selection.selectionSet) {
    throw new Error('Invalid Selection on Interface');
  }

  // Split the selection set into a list of common fields and a map from implementing type to InlineFragmentNode
  const [
    commonFields,
    uniqueFieldTypeMap
  ] = selection.selectionSet.selections.reduce<[FieldNode[], { [type: string]: InlineFragmentNode }]>(
    ([fields, typeMap], sel) => {
      if (sel.kind === 'Field') { return [fields.concat(sel), typeMap]; }
      if (sel.kind === 'InlineFragment') {
        const subType: string = sel.typeCondition!.name.value;
        return [fields, { ...typeMap, [subType]: sel }];
      }

      throw new Error('Invalid FragmentSpread found encountered!');
    },
    [[], {}]
  );

  const possibleTypes: ReadonlyArray<GraphQLObjectType> = schema.getPossibleTypes(unwrapType(nodeType) as any);
  const possibleTypeMap: { [type: string]: InlineFragmentNode | null } = possibleTypes.reduce(
    (acc, type) => ({
      ...acc,
      [type.name]: uniqueFieldTypeMap[type.name] || null
    }),
    {}
  );

  // Merge the common fields & the fragment's selections. Builds a map of type to Selection[]
  const collectedTypeMap: {[type: string]: Selection[]} = Object.keys(possibleTypeMap).reduce<{[type: string]: Selection[]}>(
    (acc, type) => ({
      ...acc,
      [type]: collectSelectionsFromNode(
        [
          ...commonFields,
          ...extractSelections(possibleTypeMap[type] ? possibleTypeMap[type]!.selectionSet : undefined)
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
    directives: extractDirectives(selection.directives),
    typeDefinition: convertTypeToIR(nodeType),
    fragments: Object.entries(collectedTypeMap).map<IFragment>(([key, value]) => ({
      kind: 'Fragment',
      directives: extractDirectives(possibleTypeMap[key] ? possibleTypeMap[key]!.directives : undefined),
      originalNode: null!,
      selections: value,
      typeDefinition: convertTypeToIR(schema.getType(key)!)
    }))
  };
};

/**
 * Converts a SelectionNode to an Selection IR object
 * @param selection A SelectionNode from the GraphQL AST
 * @param nodeType The {@link GraphQLNamedType} that the selection belongs to
 * @param schema The GraphQL Schema
 * @returns A Selection IR object
 */
const convertSelectionToIR: (
  selection: SelectionNode,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema,
) => Selection = (selection, nodeType, schema) => {

  /**
   * Determine if a selection is an interface and short circuit
   */
  if (isObjectType(nodeType) && selection.kind === 'Field') {
    const possibleInterface: GraphQLField<any, any> | undefined = nodeType.getFields()[selection.name.value];
    const unwrappedType: GraphQLNamedType | null = possibleInterface ? unwrapType(possibleInterface.type) : null;
    if (unwrappedType && isInterfaceType(unwrappedType)) {
      return convertInterfaceToInterfaceIR(selection, possibleInterface.type as any, schema);
    }
  }

  switch (selection.kind) {
    case 'Field':
      return convertFieldNodeToIR(selection, nodeType, schema);
    case 'FragmentSpread':
    case 'InlineFragment':
      throw new Error(`${selection.kind} Must Be Inlined!`);
    default:
      throw new Error('Invalid Selection');
  }
};

// const rootIntrospectionTypes: Map<string, string> = new Map([[ '__schema', '__Schema' ], [ '__type', '__Type' ]]);

/**
 * Iterates over an array of {@link SelectionNode} objects and returns an IR object for them
 * @TODO support introspection types other than __typename
 * @param selections An array of Selection Nodes from the GraphQL AST
 * @param nodeType The {@link GraphQLNamedType} that the selections belong to
 * @param schema The GraphQL Schema
 * @returns An array of Selection IR objects
 */
const collectSelectionsFromNode: (
  selections: ReadonlyArray<SelectionNode>,
  nodeType: GraphQLNamedType,
  schema: GraphQLSchema,
) => Selection[] = (selections, nodeType, schema) =>
  selections.map(selection =>
    convertSelectionToIR(selection, nodeType, schema)
  );

  /**
   * Gets the proper operation field
   * @param schema A GraphQL Schema
   * @param operation An operation type
   *
   * @returns The correct operation object
   */
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

const extractVariables: (vars: ReadonlyArray<VariableDefinitionNode> | undefined, schema: GraphQLSchema) => IVariable[] = (
  vars,
  _schema
) => {
  if (!vars || !vars.length) { return []; }
  return [];
  // return vars.map<IVariable>(v => ({
  //   kind: 'Variable',
  //   name: v.variable.name.value,
  //   originalNode: null!,
  //   type: convertTypeToIR(v.type as any)
  // }));
};

/**
 * Given a schema and a query, return an internal representation of the query
 * @param schema A GraphQL Schema
 * @param query A GraphQL Query
 * @returns An internal representation of the query
 */
const convertToIr: (
  schema: GraphQLSchema,
  query: DocumentNode
) => IOperation = (schema, query) => {
  // TODO: remove index access
  const def: OperationDefinitionNode = query
    .definitions[0] as OperationDefinitionNode;

  const operationType:
    | GraphQLObjectType
    | null
    | undefined = getOperationFields(schema, def.operation);

  if (!operationType) {
    throw new Error('Unsupported Operation');
  }

  const returnVal: IOperation = {
    kind: 'Root',
    operationType: def.operation,
    name: def.name ? def.name.value : undefined,
    variables: extractVariables(def.variableDefinitions, schema),
    directives: extractDirectives(def.directives),
    selections: collectSelectionsFromNode(
      def.selectionSet.selections,
      operationType,
      schema,
    )
  };

  return returnVal;
};

export default convertToIr;
