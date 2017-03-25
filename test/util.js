const utils = require('../packages/util');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const schemaLanguage = require('./shared/simpleSchema');
const { GraphQLSchema, introspectionQuery, graphql } = require('graphql');

const builtSchema = utils.schemaFromInputs(schemaLanguage);

describe('schema', () => {
  it('works with schema language', () => {
    expect(builtSchema).to.be.instanceof(GraphQLSchema)
  });

  describe('introspection query', () => {
    const promised = graphql(builtSchema, introspectionQuery);

    it('works with introspected query in data key', () => {
      return expect(promised.then(r => utils.schemaFromInputs(r))).to.eventually.be.instanceof(GraphQLSchema);
    });

    it('works with introspected query in data key', () => {
      return expect(promised.then(r => utils.schemaFromInputs(r.data))).to.eventually.be.instanceof(GraphQLSchema);
    });
  });

  it('works with a schema', () => {
    expect(utils.schemaFromInputs(builtSchema)).to.be.instanceof(GraphQLSchema);
  });

  it('throws on other', () => {
    expect(() => utils.schemaFromInputs({})).to.throw('Invalid Schema Input');
  })
});

const expectedNamespaceOutput = `// tslint:disable
// graphql typescript definitions

declare namespace Namespace {
test
}

// tslint:enable
`;

describe('namespace', () => {
  it ('generatesNamespace', () => {
    expect(utils.generateNamespace('Namespace', 'test')).to.eq(expectedNamespaceOutput);
  })
})
