'use strict';
const generateInterfaceName = name => `I${name}`;

const generateTypeName = name => `${name}`;

const generateTypeDeclaration = (description, name, possibleTypes) => `  //description: ${description}
  export type ${name} = ${possibleTypes};

`;

const generateInterfaceDeclaration = (description, declaration, fields, additionalInfo) => `${additionalInfo}  // description: ${description}
  export interface ${declaration} {
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

const typeToInterface = (type, ignoredTypes) => {
  if (type.kind === 'SCALAR' || type.kind === 'ENUM') {
    return null;
  }

  let isInput = type.kind === 'INPUT_OBJECT';
  let f = isInput ? type.inputFields : type.fields;

  let fields = f
                .filter(field => !ignoredTypes.includes(field.type.name))
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


module.exports = {
  typeToInterface
}
