import {
  IFromQueryOptions,
  WrapType,
  InterfaceAndTypeBuilder,
  TypePrinter,
  NamespaceGenerator
} from "@gql2ts/types";
import { DEFAULT_OPTIONS as TS_OPTIONS } from "@gql2ts/language-typescript";
import { pascalize } from "humps";

export const FLOW_WRAP_PARTIAL: WrapType = partial => `$SHAPE<${partial}>`;
export const FLOW_INTERFACE_NAMER: WrapType = name => `${pascalize(name)}`;
export const FLOW_INTERFACE_BUILDER: InterfaceAndTypeBuilder = (name, body) =>
  `export type ${name} = ${body}`;
export const FLOW_ENUM_NAME_GENERATOR: WrapType = name => `${pascalize(name)}`;
export const FLOW_TYPE_PRINTER: TypePrinter = (type, isNonNull) =>
  isNonNull ? type : `?${type}`;
export const FLOW_POST_PROCESSOR: WrapType = str => `/* @flow */
${str}
`;
export const FLOW_NAMESPACE_GENERATOR: NamespaceGenerator = (_, interfaces) => `
// graphql flow definitions
${interfaces}
`;

export const DEFAULT_OPTIONS: IFromQueryOptions = {
  ...TS_OPTIONS,
  printType: FLOW_TYPE_PRINTER,
  generateInterfaceName: FLOW_INTERFACE_NAMER,
  generateEnumName: FLOW_ENUM_NAME_GENERATOR,
  interfaceBuilder: FLOW_INTERFACE_BUILDER,
  generateNamespace: FLOW_NAMESPACE_GENERATOR,
  wrapPartial: FLOW_WRAP_PARTIAL,
  postProcessor: FLOW_POST_PROCESSOR
};

export default DEFAULT_OPTIONS;
