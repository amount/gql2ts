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
  SelectionSetNode
} from 'graphql';

interface IDirective {
  kind: 'Directive';
  name: string;
  arguments: Array<{ name: string; value: string; }>;
}

interface ITypeDefinition {
  kind: 'TypeDefinition';
  type: string;
  of?: ITypeDefinition;
  originalNode: TypeNode;
}

interface IFieldNode {
  kind: 'Field';
  name: string;
  typeDefinition: ITypeDefinition;
  directives: IDirective[];
  originalNode: FieldNode;
  selections: Selection[];
}

interface IFragment {
  kind: 'Fragment';
  typeDefinition: ITypeDefinition;
  directives: IDirective[];
  originalNode: InlineFragmentNode;
  selections: Selection[];
}

type Selection = IFieldNode | IFragment;

interface IVariable {
  kind: 'Variable';
  name: string;
  type: ITypeDefinition;
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

const convertTypeNode: (node: TypeNode) => void = node => {

}

const extractSelections: (selectionSet: SelectionSetNode | undefined) => SelectionNode[] = selectionSet =>
  selectionSet ? selectionSet.selections : [];

const convertFieldNodeToIR: (fieldNode: FieldNode) => IFieldNode = fieldNode => ({
  kind: 'Field',
  name: fieldNode.alias ? fieldNode.alias.value : fieldNode.name.value,
  originalNode: fieldNode,
  typeDefinition: null!,
  selections: collectSelectionsFromNode(extractSelections(fieldNode.selectionSet)),
  directives: [],
});

const convertSelectionToIR: (selection: SelectionNode) => Selection = selection => {
  switch (selection.kind) {
    case 'Field':
      return convertFieldNodeToIR(selection);
    case 'FragmentSpread':
      return null!;
    case 'InlineFragment':
      return null!;
    default:
      return null!;
  }
};

const collectSelectionsFromNode: (selections: SelectionNode[]) => Selection[] = selections => selections.map(convertSelectionToIR);

const convertToIr: (schema: GraphQLSchema, query: DocumentNode) => IInteralRepresentation = (schema, query) => {
  console.log(schema, query);

  const def: OperationDefinitionNode = query.definitions[0] as OperationDefinitionNode;

  return {
    kind: 'Root',
    operationType: def.operation,
    name: def.name ? def.name.value : undefined,
    variables: [],
    directives: [],
    selections: collectSelectionsFromNode(def.selectionSet.selections)
  };
};

export default convertToIr;
