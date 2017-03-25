import {
  OperationTypeNode,
  SelectionNode,
  GraphQLType,
  DefinitionNode,
  NamedTypeNode,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLInputType,
  TypeNode,
  OperationDefinitionNode,
} from 'graphql';
import { PossibleSchemaInput } from '@gql2ts/util';

export type ChildSelectionsType =
  (operation: OperationTypeNode, selection: SelectionNode, indentation: string, parent?: GraphQLType, isUndefined?: boolean)
    => IChildren;

export interface IProvidedOptions extends Partial<IOptions> {};

export type Signature = (schema: PossibleSchemaInput, query: string, typeMap?: Partial<ITypeMap>, options?: IProvidedOptions) => IReturn[];

export interface IComplexTypeSignature {
  iface: string;
  isPartial: boolean;
  name: string;
}
export interface IChildren {
  isFragment: boolean;
  isPartial: boolean;
  iface: string;
  complexTypes: IComplexTypeSignature[];
}

export interface IReturn {
  variables: string;
  interface: string;
  additionalTypes: string[];
}

export type BuildRootInterfaceName = (definition: DefinitionNode, queryNamer: QueryNamer, fragmentNamer: WrapType) => string;
export type InterfaceFormatters = (operationName: string, fields: string[]) => string;
export type FragmentInterfaceFormatter = (operationName: string, fields: string[], interfaceExtensions: string[]) => string;
export type GenerateSubTypeInterface = (selectionName: string, generatedCount: number) => string;
export type WrapType = (type: string) => string;
export type TypePrinter = (type: string, isNonNull: boolean) => string;
export type InputFormatter = (name: string, isOptional: boolean, type: string) => string;
export type QueryNamer = (def: OperationDefinitionNode) => string;

export interface IOptions {
  buildRootInterfaceName: BuildRootInterfaceName;
  formatVariableInterface: InterfaceFormatters;
  formatInterface: InterfaceFormatters;
  formatFragmentInterface: FragmentInterfaceFormatter;
  wrapList: WrapType;
  wrapPartial: WrapType;
  generateSubTypeInterfaceName: GenerateSubTypeInterface;
  printType: TypePrinter;
  formatInput: InputFormatter;
  generateFragmentName: WrapType;
  generateQueryName: QueryNamer;
};

export type RegularTypeSignature = (type: NamedTypeNode | GraphQLNamedType, isNonNull: boolean, replacement: string | null) => string;
export type VariableTypeSignature = (type: TypeNode, isNonNull?: boolean, replacement?: string | null) => string;
export type convertToTypeSignature =
  (type: GraphQLOutputType | GraphQLInputType, isNonNull?: boolean, replacement?: string | null) => string;

export interface IDefaultTypeMap {
  ID: string;
  String: string;
  Boolean: string;
  Float: string;
  Int: string;
  __DEFAULT: string;
}

export interface ITypeMap extends IDefaultTypeMap {
  [x: string]: string | undefined;
}
