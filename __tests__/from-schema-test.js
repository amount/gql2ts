'use strict';
let { schemaToInterfaces } = require('../packages/from-schema');
let { generateNamespace } = require('../packages/from-schema');
let { DEFAULT_OPTIONS: { postProcessor }} = require('../packages/language-typescript');
let schema         = require('./data/starWarsSchema');
let enumSchema     = require('./data/enumSchema');
let simpleSchema = require('./shared/simpleSchema');

describe('gql2ts', () => {
  describe('interfaces', () => {
    it('correctly translates the star wars schema into typescript defs', () => {
      let actual = schemaToInterfaces(schema, { ignoredTypes: [] });
      expect(actual).toMatchSnapshot();
    });

    it('correctly ignores types', () => {
      let actual = schemaToInterfaces(schema, { ignoredTypes: ['Person'] });
      expect(actual).toMatchSnapshot();
    });

    it('correctly translates enums', () => {
      let actual = schemaToInterfaces(enumSchema, { ignoredTypes: [] });
      expect(actual).toMatchSnapshot();
    });
  });

  describe('namespace', () => {
    it('correctly generates namespace', () => {
      let namespace = generateNamespace('GQL', schema, { ignoredTypes: [] });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly uses a custom namespace', () => {
      let namespace = generateNamespace('StarWars', schema, { ignoredTypes: [] });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly uses a namespace and ignores', () => {
      let namespace = generateNamespace('StarWars', schema, { ignoredTypes: ['Person'] });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly translates enums', () => {
      let namespace = generateNamespace('GQL', enumSchema, { ignoredTypes: [] });

      expect(namespace).toMatchSnapshot();
    });
  });

  describe('union types', () => {
    it('correctly translates the schema into typescript defs', () => {
      let actual = schemaToInterfaces(simpleSchema, { ignoredTypes: [] });
      expect(actual).toMatchSnapshot();
    });
  })

  describe('Supports older TypeScript versions', () => {
    it('removes Nullability annotations when passed', () => {
      let interfaces = schemaToInterfaces(schema, { ignoredTypes: [], legacy: true });
      expect(interfaces).toMatchSnapshot();
    });
  });
});
