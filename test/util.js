const chai = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const utils = require('../packages/util');
const { badWriteHandler } = require('../packages/util/fileIO');
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

describe('IO stuff', () => {
  it ('writes file', () => {
    const writeFileStub = sinon.stub(fs, 'writeFile');
    utils.writeToFile('test', 'test');
    expect(writeFileStub.calledOnce).to.be.true;
  })
  describe('error handler', () => {
    it ('does nothing if called w/ undefined', () => {
      expect(() => badWriteHandler(undefined)).to.throw;
    })
    it ('throws if called', () => {
      const err = new Error('Bad Write');
      expect(() => badWriteHandler(err)).to.throw(err);
    })
  })
  it ('writes file', () => {
    const readFileStub = sinon.stub(fs, 'readFileSync').returns('{}');
    utils.readFile('test');
    expect(readFileStub.calledOnce).to.be.true;
    readFileStub.reset();
  })
})
