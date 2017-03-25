import {
  InterfaceFormatters,
  BuildRootInterfaceName,
  FragmentInterfaceFormatter,
  GenerateSubTypeInterface,
  WrapType,
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

export const interfaceExtendListToString: (extensions: string[]) => string = exts => {
  if (!exts.length) { return ''; }
  return ` extends ${exts.join(', ')}`;
};

export const DEFAULT_FORMAT_FRAGMENT: FragmentInterfaceFormatter =
  (opName, fields, exts) => `export interface ${opName}${interfaceExtendListToString(exts)} {
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

export const DEFAULT_WRAP_LIST: WrapType = type => `Array<${type}>`;
export const DEFAULT_WRAP_PARTIAL: WrapType = partial => `Partial<${partial}>`;

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
