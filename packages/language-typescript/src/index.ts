import {
  GenerateSubTypeInterface,
  WrapType,
  IFromQueryOptions,
  InputFormatter,
  IDefaultTypeMap,
  QueryNamer,
  EnumFormatter,
  InterfaceAndTypeBuilder,
  InterfaceDeclarationGenerator,
  TypeJoiner,
  TypePrinter,
  NamespaceGenerator,
  InterfaceNameWithExtensions,
  GenerateDocumentation,
} from '@gql2ts/types';
import prettify from './typescriptPrettify';
import { pascalize } from 'humps';

export const DEFAULT_INTERFACE_DECLARATION: InterfaceDeclarationGenerator = fields => `{
${fields.join('\n')}
}`;

export const DEFAULT_INTERFACE_BUILDER: InterfaceAndTypeBuilder = (name, body) => `interface ${name} ${body}`;
export const DEFAULT_INTERFACE_NAMER: WrapType = name => `I${pascalize(name)}`;
export const DEFAULT_TYPE_BUILDER: InterfaceAndTypeBuilder = (name, body) => `type ${name} = ${body}`;
export const DEFAULT_TYPE_JOINER: TypeJoiner = types => types.join(' & ');
export const DEFAULT_TYPE_NAMER: WrapType = name => name;

export const interfaceExtendListToString: (extensions: string[]) => string = exts => {
  if (!exts.length) { return ''; }
  return ` extends ${exts.join(', ')}`;
};

export const ADD_INTERFACE_EXTENSIONS: InterfaceNameWithExtensions = (opName, exts) => opName + interfaceExtendListToString(exts);
export const DEFAULT_NAME_FRAGMENT: WrapType = name => `IFragment${pascalize(name)}`;
export const DEFAULT_NAME_QUERY: QueryNamer = def => def.name ? pascalize(def.name.value) : 'Anonymous';

export const DEFAULT_FORMAT_INPUT: InputFormatter = (name, isOptional, type) => ADD_SEMICOLON(`${name}${isOptional ? '?:' : ':' } ${type}`);

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

export const DEFAULT_GENERATE_SUBTYPE_INTERFACE_NAME: GenerateSubTypeInterface = selectionName => `SelectionOn${pascalize(selectionName)}`;

export const DEFAULT_ENUM_FORMATTER: EnumFormatter = values => values.map(v => `'${v.value}'`).join(' | ');

export const DEFAULT_ENUM_NAME_GENERATOR: WrapType = name => `I${pascalize(name)}Enum`;
export const DEFAULT_INPUT_NAME_GENERATOR: WrapType = name => `${pascalize(name)}Input`;
export const DEFAULT_EXPORT_FUNCTION: WrapType = declaration => `export ${declaration}`;
export const ADD_SEMICOLON: WrapType = str => `${str};`;

export const DEFAULT_NAMESPACE_GENERATOR: NamespaceGenerator = (namespaceName, interfaces) => `// tslint:disable
// graphql typescript definitions

declare namespace ${namespaceName} {
${interfaces}
}

// tslint:enable
`;

const fixDescriptionDocblock: (description?: string) => string | undefined = description =>
  description ? description.replace(/\n/g, '\n* ') : description;

export const DEFAULT_DOCUMENTATION_GENERATOR: GenerateDocumentation = ({ description, tags = [] }) => (description || tags.length) ? `
  /**
   * ${[fixDescriptionDocblock(description), ...tags.map(({ tag, value }) => `@${tag} ${value}`)].filter(x => !!x).join('\n* ')}
   */` : '';

export const DEFAULT_OPTIONS: IFromQueryOptions = {
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
  generateInterfaceDeclaration: DEFAULT_INTERFACE_DECLARATION,
  generateEnumName: DEFAULT_ENUM_NAME_GENERATOR,
  generateTypeName: DEFAULT_TYPE_NAMER,
  generateInterfaceName: DEFAULT_INTERFACE_NAMER,
  exportFunction: DEFAULT_EXPORT_FUNCTION,
  addSemicolon: ADD_SEMICOLON,
  generateNamespace: DEFAULT_NAMESPACE_GENERATOR,
  postProcessor: prettify,
  generateInputName: DEFAULT_INPUT_NAME_GENERATOR,
  addExtensionsToInterfaceName: ADD_INTERFACE_EXTENSIONS,
  generateDocumentation: DEFAULT_DOCUMENTATION_GENERATOR
};

export default DEFAULT_OPTIONS;
