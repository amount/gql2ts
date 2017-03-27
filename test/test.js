'use strict';
const expect       = require('chai').expect;
let interfaceUtils = require('../packages/from-schema');
let namespaceUtils = require('../packages/util/namespace');
let schema         = require('./data/starWarsSchema');
let enumSchema     = require('./data/enumSchema');
let expectedNamespace  = require('./data/expectedNamespace');
let expectedInterfaces = require('./data/expectedInterfaces');
let expectedLegacyInterfaces = require('./data/expectedLegacyInterfaces');

describe('gql2ts', () => {
  describe('interfaces', () => {
    it('correctly translates the star wars schema into typescript defs', () => {
      let actual = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [] });

      expect(actual).to.equal(expectedInterfaces);
    });

    it('correctly ignores types', () => {
      let actual = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: ['Person'] });
      let ignoredPerson = require('./data/ignoredPersonInterfaces');
      expect(actual).to.equal(ignoredPerson);
    });

    it('correctly translates enums', () => {
      let actual = interfaceUtils.schemaToInterfaces(enumSchema, { ignoredTypes: [] });
      let enumInterfaces = require('./data/expectedEnumInterfaces');
      expect(actual).to.equal(enumInterfaces);
    });
  });

  describe('namespace', () => {
    it('correctly generates namespace', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [] });
      let namespace = namespaceUtils.generateNamespace('GQL', interfaces);
      expect(namespace).to.equal(expectedNamespace);
    });

    it('correctly uses a custom namespace', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [] });
      let namespace = namespaceUtils.generateNamespace('StarWars', interfaces);

      let swNamespace = require('./data/starWarsNamespace');

      expect(namespace).to.equal(swNamespace);
    });

    it('correctly uses a namespace and ignores', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: ['Person'] });
      let namespace = namespaceUtils.generateNamespace('StarWars', interfaces);

      let swNamespace = require('./data/ignoredPerson');

      expect(namespace).to.equal(swNamespace);
    });

    it('correctly translates enums', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(enumSchema, { ignoredTypes: [] });
      let namespace = namespaceUtils.generateNamespace('GQL', interfaces);

      let enumNamespace = require('./data/expectedEnum');

      expect(namespace).to.equal(enumNamespace);
    });
  });

  describe('Supports older TypeScript versions', () => {
    it('removes Nullability annotations when passed', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [], legacy: true });
      expect(interfaces).to.equal(expectedLegacyInterfaces);
    });
  });
});
