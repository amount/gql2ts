'use strict';
const expect       = require('chai').expect;
let { schemaToInterfaces } = require('../packages/from-schema');
let { generateNamespace } = require('../packages/from-schema');
let { DEFAULT_OPTIONS: { postProcessor }} = require('../packages/language-typescript');
let schema         = require('./data/starWarsSchema');
let enumSchema     = require('./data/enumSchema');
let expectedNamespace  = require('./data/expectedNamespace');
let expectedInterfaces = require('./data/expectedInterfaces');
let expectedLegacyInterfaces = require('./data/expectedLegacyInterfaces');

describe('gql2ts', () => {
  describe('interfaces', () => {
    it('correctly translates the star wars schema into typescript defs', () => {
      let actual = schemaToInterfaces(schema, { ignoredTypes: [] });

      expect(postProcessor(actual)).to.equal(postProcessor(expectedInterfaces));
    });

    it('correctly ignores types', () => {
      let actual = schemaToInterfaces(schema, { ignoredTypes: ['Person'] });
      let ignoredPerson = require('./data/ignoredPersonInterfaces');
      expect(postProcessor(actual)).to.equal(postProcessor(ignoredPerson));
    });

    it('correctly translates enums', () => {
      let actual = schemaToInterfaces(enumSchema, { ignoredTypes: [] });
      let enumInterfaces = require('./data/expectedEnumInterfaces');
      expect(postProcessor(actual)).to.equal(postProcessor(enumInterfaces));
    });
  });

  describe('namespace', () => {
    it('correctly generates namespace', () => {
      let namespace = generateNamespace('GQL', schema, { ignoredTypes: [] });
      expect(namespace).to.equal(expectedNamespace);
    });

    it('correctly uses a custom namespace', () => {
      let namespace = generateNamespace('StarWars', schema, { ignoredTypes: [] });

      let swNamespace = require('./data/starWarsNamespace');

      expect(namespace).to.equal(swNamespace);
    });

    it('correctly uses a namespace and ignores', () => {
      let namespace = generateNamespace('StarWars', schema, { ignoredTypes: ['Person'] });

      let swNamespace = require('./data/ignoredPerson');

      expect(namespace).to.equal(swNamespace);
    });

    it('correctly translates enums', () => {
      let namespace = generateNamespace('GQL', enumSchema, { ignoredTypes: [] });

      let enumNamespace = require('./data/expectedEnum');

      expect(namespace).to.equal(enumNamespace);
    });
  });

  describe('Supports older TypeScript versions', () => {
    it('removes Nullability annotations when passed', () => {
      let interfaces = schemaToInterfaces(schema, { ignoredTypes: [], legacy: true });
      expect(postProcessor(interfaces)).to.equal(postProcessor(expectedLegacyInterfaces));
    });
  });
});
