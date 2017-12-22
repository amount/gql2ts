import {
  OperationTypeNode,
  SelectionNode,
  GraphQLType,
  NamedTypeNode,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLInputType,
  TypeNode,
  OperationDefinitionNode,
  GraphQLEnumValue,
  FieldNode,
} from 'graphql';
import { PossibleSchemaInput } from '@gql2ts/util';

export type GetChildSelectionsType =
  (operation: OperationTypeNode, selection: SelectionNode, parent?: GraphQLType, isUndefined?: boolean)
    => IChildSelection;

export interface IProvidedOptions extends Partial<IFromQueryOptions> { }

export type FromQuerySignature =
  (schema: PossibleSchemaInput, query: string, typeMap?: Partial<ITypeMap>, options?: IProvidedOptions) => IFromQueryReturnValue[];

export interface IComplexTypeSignature {
  iface: string;
  isPartial: boolean;
  name: string;
}
export interface IChildSelection {
  isFragment: boolean;
  isPartial: boolean;
  iface: string;
  complexTypes: IComplexTypeSignature[];
}

export interface IFromQueryReturnValue {
  variables: string;
  interface: string;
  additionalTypes: string[];
  result: string;
}

export type InterfaceFormatters = (operationName: string, fields: string[]) => string;
export type InterfaceNameWithExtensions = (operationName: string, extensions: string[]) => string;
export type GenerateSubTypeInterface = (selectionName: string, selection: FieldNode) => string | null;
export type WrapType = (type: string) => string;
export type TypePrinter = (type: string, isNonNull: boolean) => string;
export type InputFormatter = (name: string, isOptional: boolean, type: string) => string;
export type QueryNamer = (def: OperationDefinitionNode) => string;
export type EnumFormatter = (values: GraphQLEnumValue[]) => string;
export type InterfaceAndTypeBuilder = (name: string, body: string) => string;
export type EnumTypeBuilder = (name: string, values: string) => string;
export type TypeJoiner = (types: string[]) => string;
export type InterfaceDeclarationGenerator = (fields: string[], indentation?: string) => string;
export type NamespaceGenerator = (namespaceName: string, interfaces: string) => string;

export interface IFromQueryOptions {
  wrapList: WrapType;
  wrapPartial: WrapType;
  generateSubTypeInterfaceName: GenerateSubTypeInterface;
  printType: TypePrinter;
  formatInput: InputFormatter;
  generateFragmentName: WrapType;
  generateQueryName: QueryNamer;
  interfaceBuilder: InterfaceAndTypeBuilder;
  typeBuilder: InterfaceAndTypeBuilder;
  enumTypeBuilder: EnumTypeBuilder;
  generateEnumName: WrapType;
  formatEnum: EnumFormatter;
  typeJoiner: TypeJoiner;
  generateInterfaceDeclaration: InterfaceDeclarationGenerator;
  generateTypeName: WrapType;
  generateInterfaceName: WrapType;
  exportFunction: WrapType;
  addSemicolon: WrapType;
  generateNamespace: NamespaceGenerator;
  postProcessor: WrapType;
  generateInputName: WrapType;
  addExtensionsToInterfaceName: InterfaceNameWithExtensions;
}

export type HandleNamedTypes = (type: NamedTypeNode | GraphQLNamedType, isNonNull: boolean, replacement: string | null) => string;
export type HandleInputTypes = (type: TypeNode, isNonNull?: boolean, replacement?: string | null) => string;
export type ConvertToTypeSignature =
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
