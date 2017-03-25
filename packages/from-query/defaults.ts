import {
  InterfaceFormatters,
  BuildRootInterfaceName,
  FragmentInterfaceFormatter,
  GenerateSubTypeInterface,
  WrapList,
  WrapPartial,
  IOptions,
  InputFormatter,
  IDefaultTypeMap,
} from './types';

export const DEFAULT_FORMAT_INTERFACE: InterfaceFormatters = (opName, fields) => `export interface ${opName} {
${fields.join('\n  ')}
}`;

export const DEFAULT_FORMAT_VARIABLES: InterfaceFormatters = (opName, fields) => `export interface ${opName}Input {
  ${fields.join('\n  ')}
}`;

export const DEFAULT_FORMAT_FRAGMENT: FragmentInterfaceFormatter = (opName, fields, ext) => `export interface ${opName}${ext} {
${fields.join('\n')}
}`;

export const DEFAULT_FORMAT_INPUT: InputFormatter = (name, isOptional, type) => `${name}${isOptional ? '?:' : ':' } ${type};`;

export const DEFAULT_BUILD_ROOT_INTERFACE_NAME: BuildRootInterfaceName = def => {
  if (def.kind === 'OperationDefinition') {
    return def.name ? def.name.value : 'Anonymous';
  } else if (def.kind === 'FragmentDefinition') {
    return `IFragment${def.name.value}`;
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

export const DEFAULT_WRAP_LIST: WrapList = type => `Array<${type}>`;

export const DEFAULT_WRAP_PARTIAL: WrapPartial = possiblePartial => {
  if (possiblePartial.isPartial) {
    return `Partial<${possiblePartial.iface}>`;
  } else {
    return possiblePartial.iface;
  }
};
export const DEFAULT_TYPE_PRINTER: (type: string, isNonNull: boolean) => string = (type, isNonNull) => isNonNull ? type : `${type} | null`;
export const DEFAULT_GENERATE_SUBTYPE_INTERFACE_NAME: GenerateSubTypeInterface =
  (selectionName, generatedCount) => `SelectionOn${selectionName}${!!generatedCount ? generatedCount : ''}`;

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
};
