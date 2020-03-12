// tslint:disable

import { IOperation, Selection, TypeDefinition, IInterfaceNode, IFieldNode, IDirectiveMap } from './ir';
import { IFromQueryOptions } from '@gql2ts/types';

const getReferenceType: (type: TypeDefinition) => string = type => {
  switch (type.kind) {
    case 'TypenameDefinition':
      return Array.isArray(type.type) ? typeUnion(type.type) : type.type;
    case 'TypeDefinition':
      return `SelectionOn${type.type}`;
    case 'ListTypeDefinition':
      return getReferenceType(type.of);
    case 'EnumTypeDefinition':
      return type.type;
    default:
      throw new Error('Unsupported TypeDefinition');
  }
};

const hasDirectives: (directives: IDirectiveMap) => boolean = directives =>
  !!directives.include || !!directives.skip

const generateSelectionName = (selection: IInterfaceNode | IFieldNode): string => {
  switch (selection.kind) {
    case 'Field':
      return selection.name;
    case 'InterfaceNode':
      return selection.name;
  }
}

// Print functions
const typeUnion: (types: string[]) => string = types => types.join(' | ');
const quoteValue: (value: string) => string = value => `'${value}'`;

const printStringLiteral: (stringLiteral: string) => string = stringLiteral => `'${stringLiteral}'`;
const printEnum: (values: string[]) => string = values => typeUnion(values.map(quoteValue));
const printArray = (OPTIONS: IFromQueryOptions) => OPTIONS.wrapList;
const printInterface: (OPTIONS: IFromQueryOptions, node: IInterfaceNode) => string = (OPTIONS, selection) => typeUnion(
  selection.fragments.map(frag => {
    const name = (frag.directives.gql2ts && frag.directives.gql2ts.arguments.interfaceName) ?
      frag.directives.gql2ts.arguments.interfaceName :
      OPTIONS.generateFragmentName((frag.typeDefinition as any).type)
    return name;
  })
);



export default (OPTIONS: IFromQueryOptions): (ir: IOperation) => string => {

  const printNullable: (underlyingType: string) => string = type => OPTIONS.printType(type, false);
  const wrapNullable: (type: TypeDefinition) => (nullablePrinter: typeof printNullable) => typeof printNullable = ({ nullable }) => nullablePrinter => str => (
    nullable ? nullablePrinter(str) : str
  );

  const printType: (type: TypeDefinition | string, node: Selection, nameOverride?: string) => string = (type, node, nameOverride) => {
    if (typeof type === 'string') {
      // @TODO use user input not the default
      return OPTIONS.typeMap[type] || OPTIONS.typeMap.__DEFAULT;
    }

    const nullWrapper = wrapNullable(type)(printNullable);

    switch (type.kind) {
      case 'TypenameDefinition':
        return nullWrapper(Array.isArray(type.type) ? typeUnion(type.type.map(printStringLiteral)) : printStringLiteral(type.type));
      case 'TypeDefinition':
        return nullWrapper(type.isScalar ? OPTIONS.typeMap[type.type] || OPTIONS.typeMap.__DEFAULT : nameOverride || type.type);
      case 'ListTypeDefinition':
        return nullWrapper(printArray(printType(type.of, node, nameOverride)));
      case 'InterfaceTypeDefinition':
        return nullWrapper(printInterface(OPTIONS, node as IInterfaceNode));
      case 'EnumTypeDefinition':
        return nullWrapper(printEnum(type.values))
      default:
        throw new Error('Unsupported TypeDefinition');
    }
  }

  interface IPrintField {
    name: string
    type: TypeDefinition | string
    node: Selection
    nameOverride?: string
    optional?: boolean
  }

  const printField: (props: IPrintField) => string = ({
    name, type, node, nameOverride, optional = false
  }) => `${name}${optional ? '?' : ''}: ${printType(type, node, nameOverride)};`;

  class TypePrinter {
    private _declarations: Map<string, string[]> = new Map();

    constructor (private ir: IOperation) { }

    printQuery (): string {
      this.buildDeclarations(this.ir.name || 'AnonymousQuery', this.ir.selections);

      return [...Array.from(this._declarations.entries())].map(([key, value]) =>
        OPTIONS.exportFunction(
          OPTIONS.interfaceBuilder(
            key,
            OPTIONS.generateInterfaceDeclaration(value)
          )
        )
      ).join('\n\n');
    }

    private buildDeclarations (parent: string, selections: Selection[]) {
      let currentName = parent;
      let count = 1;
      const nextDeclaration = selections.map(selection => this.buildDeclaration(selection));
      const nextDeclarationSearchKey = [...nextDeclaration].sort().join('\n');

      while (this._declarations.has(currentName)) {
        const preExistingDeclaration = [...this._declarations.get(currentName)!].sort().join('\n');

        if (preExistingDeclaration === nextDeclarationSearchKey) {
          return currentName;
        }

        currentName = parent + count++;
      }

      this._declarations.set(currentName, selections.map(selection => this.buildDeclaration(selection)));

      return currentName;
    }

    private buildDeclaration (selection: Selection): string {
      const basePrintFields = {
        name: selection.name,
        type: selection.typeDefinition,
        node: selection
      };

      switch (selection.kind) {
        case 'Field':
          return printField({
            ...basePrintFields,
            nameOverride: this.buildDeclarations(getReferenceType(selection.typeDefinition), selection.selections),
            optional: hasDirectives(selection.directives)
          });
        case 'InterfaceNode':
          selection.fragments.map(frag => {
            let name = (frag.directives.gql2ts && frag.directives.gql2ts.arguments.interfaceName) ?
              frag.directives.gql2ts.arguments.interfaceName :
              frag.typeDefinition.kind === 'TypeDefinition' ?
                OPTIONS.generateFragmentName(frag.typeDefinition.type) :
                'InterfaceNode' + Math.random().toString().replace('.', '');
            name = this.buildDeclarations(name, frag.selections);

            frag.directives = frag.directives || {};
            frag.directives.gql2ts = {
              ...(frag.directives.gql2ts || {}),
              arguments: {
                ...((frag.directives.gql2ts || { arguments: {} }).arguments),
                interfaceName: name
              }
            }

            return name;
          });

          const selectionHasDirectives = hasDirectives(selection.directives);
          const fragmentsHaveDirectives = !!selection.fragments.some(frag => hasDirectives(frag.directives))

          return printField({
            ...basePrintFields,
            name: generateSelectionName(selection),
            optional: selectionHasDirectives || fragmentsHaveDirectives
          });
        case 'TypenameNode':
          return printField({
            ...basePrintFields
          });
        case 'LeafNode':
          return printField({
            ...basePrintFields,
            optional: hasDirectives(selection.directives)
          });
        default:
          throw new Error('Unsupported Selection');
      }
    }
  }


  const generateTypes: (ir: IOperation) => string = ir => new TypePrinter(ir).printQuery();

  return generateTypes;
}
