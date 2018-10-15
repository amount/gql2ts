// tslint:disable

import { IOperation, Selection, TypeDefinition, IInterfaceNode, IFieldNode } from './ir';
import { DEFAULT_TYPE_MAP } from '@gql2ts/language-typescript';

const printArray: (underlyingType: string) => string = type => `Array<${type}>`;
const printNullable: (underlyingType: string) => string = type => `${type} | null`;
const wrapNullable: (type: TypeDefinition) => (nullablePrinter: typeof printNullable) => typeof printNullable = ({ nullable }) => nullablePrinter => str => (
  nullable ? nullablePrinter(str) : str
);

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

const printType: (type: TypeDefinition | string, node: Selection, nameOverride?: string) => string = (type, node, nameOverride) => {
  if (typeof type === 'string') {
    // @TODO use user input not the default
    return DEFAULT_TYPE_MAP[type] || DEFAULT_TYPE_MAP.__DEFAULT;
  }
  const nullWrapper = wrapNullable(type)(printNullable);
  switch (type.kind) {
    case 'TypenameDefinition':
      return nullWrapper(Array.isArray(type.type) ? typeUnion(type.type.map(printStringLiteral)) : printStringLiteral(type.type));
    case 'TypeDefinition':
      return nullWrapper(type.isScalar ? DEFAULT_TYPE_MAP[type.type] || DEFAULT_TYPE_MAP.__DEFAULT : nameOverride || type.type);
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

const printField: (name: string, type: TypeDefinition | string, node: Selection, nameOverride?: string) => string = (name, type, node, nameOverride) => `${name}: ${printType(type, node, nameOverride)};`;

class TypePrinter {
  private _declarations: Map<string, string[]> = new Map();

  constructor (private ir: IOperation) { }

  printQuery (): string {
    this.buildDeclarations(this.ir.name || 'AnonymousQuery', this.ir.selections);

    return [...Array.from(this._declarations.entries())].map(([key, value]) => `${key}\n=======\n${value.join('\n')}`).join('\n\n');
  }

  private buildDeclarations (parent: string, selections: Selection[]) {
    let currentName = parent;
    let count = 1;
    const nextDeclaration = selections.map(selection => this.buildDeclaration(selection));
    const nextDeclarationSearchKey = nextDeclaration.join('\n');

    while (this._declarations.has(currentName)) {
      const preExistingDeclaration = this._declarations.get(currentName)!.join('\n');

      if (preExistingDeclaration === nextDeclarationSearchKey) {
        return currentName;
      }

      currentName = parent + count++;
    }

    this._declarations.set(currentName, selections.map(selection => this.buildDeclaration(selection)));

    return currentName;
  }

  private buildDeclaration (selection: Selection): string {
    switch (selection.kind) {
      case 'Field':
        const fieldName = this.buildDeclarations(getReferenceType(selection.typeDefinition), selection.selections);
        return printField(selection.name, selection.typeDefinition, selection, fieldName);
      case 'InterfaceNode':
        selection.fragments.map(frag => {
          const name = (frag.directives.gql2ts && frag.directives.gql2ts.arguments.interfaceName) ?
            frag.directives.gql2ts.arguments.interfaceName :
            frag.typeDefinition.kind === 'TypeDefinition' ?
              `FragmentSelectionOn${frag.typeDefinition.type}` :
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
        return printField(selection.name, selection.typeDefinition, selection);
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
