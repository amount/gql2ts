// tslint:disable

import { IOperation, Selection, TypeDefinition, IInterfaceNode, IFieldNode } from './ir';

const printArray: (underlyingType: string) => string = type => `Array<${type}>`;
const printNullable: (underlyingType: string) => string = type => `${type} | null`;
const wrapNullable: (type: TypeDefinition) => (nullablePrinter: typeof printNullable) => typeof printNullable = ({ nullable }) => nullablePrinter => str => nullable ? nullablePrinter(str) : str;

const typeUnion: (types: string[]) => string = types => types.join(' | ');

const printStringLiteral: (stringLiteral: string) => string = stringLiteral => `'${stringLiteral}'`;

const printInterface: (node: IInterfaceNode) => string = selection => typeUnion(
  selection.fragments.map(frag => {
    const name = (frag.directives.gql2ts && frag.directives.gql2ts.arguments.interfaceName) ?
      frag.directives.gql2ts.arguments.interfaceName :
      `FragmentSelectionOn${(frag.typeDefinition as any).type}`
    return name;
  })
);

const printType: (type: TypeDefinition | string, node: Selection) => string = (type, node) => {
  if (typeof type === 'string') { return type; }
  const nullWrapper = wrapNullable(type)(printNullable);
  switch (type.kind) {
    case 'TypenameDefinition':
      return nullWrapper(Array.isArray(type.type) ? typeUnion(type.type.map(printStringLiteral)) : printStringLiteral(type.type));
    case 'TypeDefinition':
      return nullWrapper(type.type);
    case 'ListTypeDefinition':
      return nullWrapper(printArray(printType(type.of, node)));
    case 'InterfaceTypeDefinition':
      return nullWrapper(printInterface(node as IInterfaceNode));
    default:
      throw new Error('Unsupported TypeDefinition');
  }
}

const getReferenceType: (type: TypeDefinition) => string = type => {
  switch (type.kind) {
    case 'TypenameDefinition':
      return Array.isArray(type.type) ? typeUnion(type.type) : type.type;
    case 'TypeDefinition':
      return type.type;
    case 'ListTypeDefinition':
      return getReferenceType(type.of);
    default:
      throw new Error('Unsupported TypeDefinition');
  }
};

const printField: (name: string, type: TypeDefinition | string, node: Selection) => string = (name, type, node) => `${name}: ${printType(type, node)};`;

class TypePrinter {
  private _declarations: Map<string, string[]> = new Map();

  constructor (private ir: IOperation) { }

  printQuery (): string {
    this.buildDeclarations(this.ir.name || 'AnonymousQuery', this.ir.selections);

    return [...this._declarations].map(([key, value]) => `${key}\n=======\n${value.join('\n')}`).join('\n\n');
  }

  private buildDeclarations (parent: string, selections: Selection[]) {
    this._declarations.set(parent, selections.map(selection => this.buildDeclaration(selection)));
  }

  private buildDeclaration (selection: Selection): string {
    switch (selection.kind) {
      case 'Field':
        this.buildDeclarations(getReferenceType(selection.typeDefinition), selection.selections);
        return printField(selection.name, selection.typeDefinition, selection);
      case 'InterfaceNode':
        selection.fragments.map(frag => {
          const name = (frag.directives.gql2ts && frag.directives.gql2ts.arguments.interfaceName) ?
            frag.directives.gql2ts.arguments.interfaceName :
            'InterfaceNode' + Math.random().toString().replace('.', '');
          this.buildDeclarations(name, frag.selections)
          return name;
        });
        return printField(
          this.generateSelectionName(selection),
          selection.typeDefinition,
          selection
        );
      case 'TypenameNode':
        return printField('__typename', selection.typeDefinition, selection);
      case 'LeafNode':
        return printField(selection.name, selection.typeDefinition, selection);
      default:
        throw new Error('Unsupported Selection');
    }
  }

  private generateSelectionName (selection: IInterfaceNode | IFieldNode): string {
    switch (selection.kind) {
      case 'Field':
        return selection.name;
      case 'InterfaceNode':
        return selection.name;
    }

    // this._declarations.has(selection.name)
  }
}


export const generateTypes: (ir: IOperation) => string = ir => new TypePrinter(ir).printQuery();
