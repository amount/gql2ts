'use strict';
const expect       = require('chai').expect;
let interfaceUtils = require('../util/interface');
let moduleUtils    = require('../util/module');
let expectedModule = require('./data/expectedModule');
let schema         = require('./data/starWarsSchema');
let expectedInterfaces = require('./data/expectedInterfaces');

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
  });

  describe('modules', () => {
    it('correctly generates Modules', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [] });
      let module = moduleUtils.generateModule('GQL', interfaces);
      expect(module).to.equal(expectedModule);
    });

    it('correctly uses a custom namespace', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: [] });
      let module = moduleUtils.generateModule('StarWars', interfaces);

      let swModule = require('./data/starWarsModule');

      expect(module).to.equal(swModule);
    });

    it('correctly uses a namespace and ignores', () => {
      let interfaces = interfaceUtils.schemaToInterfaces(schema, { ignoredTypes: ['Person'] });
      let module = moduleUtils.generateModule('StarWars', interfaces);

      let swModule = require('./data/ignoredPerson');

      expect(module).to.equal(swModule);
    })
  });
});
