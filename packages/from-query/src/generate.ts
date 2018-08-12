// tslint:disable

import { IInteralRepresentation, Selection, TypeDefinition } from './ir';

const printArray: (underlyingType: string) => string = type => `Array<${type}>`;

const typeUnion: (types: string[]) => string = types => types.join(' | ');

const printStringLiteral: (stringLiteral: string) => string = stringLiteral => `'${stringLiteral}'`;

const printType: (type: TypeDefinition | string) => string = type => {
  if (typeof type === 'string') { return type; }
  switch (type.kind) {
    case 'TypenameDefinition':
      return Array.isArray(type.type) ? typeUnion(type.type.map(printStringLiteral)) : printStringLiteral(type.type);
    case 'TypeDefinition':
      return type.type;
    case 'NonNullTypeDefinition':
      return printType(type.of);
    case 'ListTypeDefinition':
      return printArray(printType(type.of));
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
    case 'NonNullTypeDefinition':
      return printType(type.of);
    case 'ListTypeDefinition':
      return printType(type.of);
    default:
      throw new Error('Unsupported TypeDefinition');
  }
}

const printField: (name: string, type: TypeDefinition | string) => string = (name, type) => `${name}: ${printType(type)};`;

class TypePrinter {
  private _declarations: Map<string, string[]> = new Map();

  constructor (private ir: IInteralRepresentation) { }

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
        return printField(selection.name, selection.typeDefinition);
      case 'InterfaceNode':
        return printField(
          selection.name,
          typeUnion(
            selection.fragments.map(frag => {
              const name = 'InterfaceNode' + Math.random().toString().replace('.', '');
              this.buildDeclarations(name, frag.selections)
              return name;
            })
          )
        );
      case 'TypenameNode':
        return printField('__typename', selection.typeDefinition);
      case 'LeafNode':
        return printField(selection.name, selection.typeDefinition);
      default:
        throw new Error('Unsupported Selection');
    }
  }
}


export const generateTypes: (ir: IInteralRepresentation) => string = ir => new TypePrinter(ir).printQuery();
