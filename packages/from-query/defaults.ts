import {
  InterfaceFormatters,
  BuildRootInterfaceName,
  FragmentInterfaceFormatter,
  GenerateSubTypeInterface,
  WrapType,
  IOptions,
  InputFormatter,
  IDefaultTypeMap,
  QueryNamer,
  EnumFormatter,
  InterfaceAndTypeBuilder,
  InterfaceDeclarationGenerator,
  TypeJoiner,
  Indentation,
  TypePrinter,
} from './types';

export const DEFAULT_FORMAT_INTERFACE: InterfaceFormatters = (opName, fields) => `export interface ${opName} {
${fields.join('\n  ')}
}`;

export const DEFAULT_FORMAT_VARIABLES: InterfaceFormatters = (opName, fields) => `export interface ${opName}Input {
  ${fields.join('\n  ')}
}`;

export const DEFAULT_INTERFACE_DECLARATION: InterfaceDeclarationGenerator = (fields, indentation= '') => `{
${fields.join('\n')}
${indentation}}`;

export const DEFAULT_INTERFACE_BUILDER: InterfaceAndTypeBuilder = (name, body) => `export interface ${name} ${body}`;
export const DEFAULT_TYPE_BUILDER: InterfaceAndTypeBuilder = (name, body) => `export type ${name} = ${body}`;
export const DEFAULT_TYPE_JOINER: TypeJoiner = types => types.join(' & ');

export const DEFAULT_INDENTATION: Indentation = '  ';

export const interfaceExtendListToString: (extensions: string[]) => string = exts => {
  if (!exts.length) { return ''; }
  return ` extends ${exts.join(', ')}`;
};

export const DEFAULT_FORMAT_FRAGMENT: FragmentInterfaceFormatter =
  (opName, fields, exts) => `export interface ${opName}${interfaceExtendListToString(exts)} {
${fields.join('\n')}
}`;

export const DEFAULT_NAME_FRAGMENT: WrapType = name => `IFragment${name}`;
export const DEFAULT_NAME_QUERY: QueryNamer = def => def.name ? def.name.value : 'Anonymous';

export const DEFAULT_FORMAT_INPUT: InputFormatter = (name, isOptional, type) => `${name}${isOptional ? '?:' : ':' } ${type};`;

export const DEFAULT_BUILD_ROOT_INTERFACE_NAME: BuildRootInterfaceName = (def, queryNamer, fragmentNamer) => {
  if (def.kind === 'OperationDefinition') {
    return queryNamer(def);
  } else if (def.kind === 'FragmentDefinition') {
    return fragmentNamer(def.name.value);
  } else {
    throw new Error(`Unsupported Definition ${def.kind}`);
  }
};

export const DEFAULT_TYPE_MAP: IDefaultTypeMap = {
  ID: 'string',
  String: 'string',
  Boolean: 'boolean',
  Float: 'number',
  Int: 'number',
  __DEFAULT: 'any',
};

export const DEFAULT_WRAP_LIST: WrapType = type => `Array<${type}>`;
export const DEFAULT_WRAP_PARTIAL: WrapType = partial => `Partial<${partial}>`;

export const DEFAULT_TYPE_PRINTER: TypePrinter = (type, isNonNull) => isNonNull ? type : `${type} | null`;

export const DEFAULT_GENERATE_SUBTYPE_INTERFACE_NAME: GenerateSubTypeInterface =
  (selectionName) => `SelectionOn${selectionName}`;

export const DEFAULT_ENUM_FORMATTER: EnumFormatter = values => values.map(v => `'${v.value}'`).join(' | ');

export const DEFAULT_OPTIONS: IOptions = {
  buildRootInterfaceName: DEFAULT_BUILD_ROOT_INTERFACE_NAME,
  formatVariableInterface: DEFAULT_FORMAT_VARIABLES,
  formatInterface: DEFAULT_FORMAT_INTERFACE,
  formatFragmentInterface: DEFAULT_FORMAT_FRAGMENT,
  wrapList: DEFAULT_WRAP_LIST,
  wrapPartial: DEFAULT_WRAP_PARTIAL,
  generateSubTypeInterfaceName: DEFAULT_GENERATE_SUBTYPE_INTERFACE_NAME,
  printType: DEFAULT_TYPE_PRINTER,
  formatInput: DEFAULT_FORMAT_INPUT,
  generateFragmentName: DEFAULT_NAME_FRAGMENT,
  generateQueryName: DEFAULT_NAME_QUERY,
  formatEnum: DEFAULT_ENUM_FORMATTER,
  interfaceBuilder: DEFAULT_INTERFACE_BUILDER,
  typeBuilder: DEFAULT_TYPE_BUILDER,
  typeJoiner: DEFAULT_TYPE_JOINER,
  defaultIndentation: DEFAULT_INDENTATION,
  generateInterfaceDeclaration: DEFAULT_INTERFACE_DECLARATION,
};
