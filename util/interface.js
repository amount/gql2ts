'use strict';
require('./polyfill');

const generateRootTypes = rootName => `  export interface IGraphQLResponseRoot {
    data?: ${generateInterfaceName(rootName)};
    errors?: Array<IGraphQLResponseError>;
  }

  export interface IGraphQLResponseError {
    message: string;              // Required for all errors
    locations?: Array<IGraphQLResponseErrorLocation>;
    [propName: string]: string;   // 7.2.2 says 'GraphQL servers may provide additional entries to error'
  }

  export interface IGraphQLResponseErrorLocation {
    line: number;
    column: number;
  }`

const generateInterfaceName = name => `I${name}`;

const generateTypeName = name => `${name}`;

const generateTypeDeclaration = (description, name, possibleTypes) => `  /*
    description: ${description}
  */
  export type ${name} = ${possibleTypes};

`;

const generateInterfaceDeclaration = (description, declaration, fields, additionalInfo) => `${additionalInfo}  /*
    description: ${description}
  */
  export interface ${declaration} {
    __typename: string;
${fields}
  }`;

/**
  * TODO
  * - add support for custom types (via optional json file or something)
  * - allow this to return metadata for Non Null types
  */
const resolveInterfaceName = type => {
  switch (type.kind) {
  case 'LIST':
    return `Array<${resolveInterfaceName(type.ofType)}>`;
  case 'NON_NULL':
    return `!${resolveInterfaceName(type.ofType)}`;
  case 'SCALAR':
    switch (type.name) {
    case 'ID':
    case 'String':
      return 'string';

    case 'Boolean':
      return 'boolean';

    case 'Float':
    case 'Integer':
      return 'number';

    default:
      return 'any';
    }

  case 'INTERFACE':
    return generateTypeName(type.name);

  default:
    return generateInterfaceName(type.name);
  }
};

const fieldToDefinition = (field, isInput) => {
  let interfaceName = resolveInterfaceName(field.type);
  let fieldDef;
  let isNotNull = interfaceName.includes('!');

  if (isNotNull) {
    /**
      * should probably refactor this at some point to have
      * `resolveInterfaceName` return better metadata
      * global regex replace is ugly
      */
    interfaceName = interfaceName.replace(/\!/g, '');
  }

  if (isInput && !isNotNull) {
    fieldDef = `${field.name}?: ${interfaceName}`;
  } else {
    fieldDef = `${field.name}: ${interfaceName}`;
  }

  return `    ${fieldDef};`;
}

const findRootType = (type) => {
  if (!type.ofType) { return type; }

  return findRootType(type.ofType);
}

const filterField = (field, ignoredTypes) => {
  let nestedType = findRootType(field.type);
  return !ignoredTypes.includes(nestedType.name);
}

const typeToInterface = (type, ignoredTypes) => {
  if (type.kind === 'SCALAR' || type.kind === 'ENUM') {
    return null;
  }

  let isInput = type.kind === 'INPUT_OBJECT';
  let f = isInput ? type.inputFields : type.fields;

  let fields = f
                .filter(field => filterField(field, ignoredTypes))
                .map(field => fieldToDefinition(field, isInput))
                .filter(field => field)
                .join('\n');

  let interfaceDeclaration = generateInterfaceName(type.name);
  let additionalInfo = '';

  if (type.kind === 'INTERFACE' || type.kind === 'UNION') {
    let possibleTypes = type.possibleTypes
                          .filter(type => !ignoredTypes.includes(type.name))
                          .map(type => generateInterfaceName(type.name));

    if (possibleTypes.length) {
      additionalInfo = generateTypeDeclaration(type.description, generateTypeName(type.name), possibleTypes.join(' | '))
      interfaceDeclaration += ` extends ${possibleTypes.join(', ')}`;
    }
  }

  return generateInterfaceDeclaration(type.description, interfaceDeclaration, fields, additionalInfo);
};

const typesToInterfaces = (schema, options) => {
  return [
    generateRootTypes(schema.queryType.name),       // add root entry point & errors
    ...schema.types
      .filter(type => !type.name.startsWith('__'))  // remove introspection types
      .filter(type =>                               // remove ignored types
        !options.ignoredTypes.includes(type.name)
      )
      .map(type =>                                  // convert to interface
        typeToInterface(type, options.ignoredTypes)
      )
      .filter(type => type)                         // remove empty ones
  ].join('\n\n');                                   // put whitespace between them
}

const schemaToInterfaces = (schema, options) => typesToInterfaces(schema.data.__schema, options);

module.exports = {
  schemaToInterfaces
}
