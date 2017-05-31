// const sinon = require('sinon');
// const fs = require('fs');

const utils = require('../packages/util');
const { badWriteHandler } = require('../packages/util/dist/fileIO');
const schemaLanguage = require('./shared/simpleSchema');
const { GraphQLSchema, introspectionQuery, graphql } = require('graphql');

const builtSchema = utils.schemaFromInputs(schemaLanguage);

describe('schema', () => {
  it('works with schema language', () => {
    expect(builtSchema).toBeInstanceOf(GraphQLSchema)
  });

  describe('introspection query', () => {
    const promised = graphql(builtSchema, introspectionQuery);

    it('works with introspected query in data key', () => {
      return expect(promised.then(r => utils.schemaFromInputs(r))).resolves.toBeInstanceOf(GraphQLSchema);
    });

    it('works with introspected query in data key', () => {
      return expect(promised.then(r => utils.schemaFromInputs(r.data))).resolves.toBeInstanceOf(GraphQLSchema);
    });
  });

  it('works with a schema', () => {
    expect(utils.schemaFromInputs(builtSchema)).toBeInstanceOf(GraphQLSchema);
  });

  it('throws on other', () => {
    expect(() => utils.schemaFromInputs({})).toThrowError('Invalid Schema Input');
  })
});

// describe('IO stuff', () => {
//   it ('writes file', () => {
//     const writeFileStub = sinon.stub(fs, 'writeFile');
//     utils.writeToFile('test', 'test');
//     expect(writeFileStub.calledOnce).toBe(true);
//   })
//   describe('error handler', () => {
//     it ('does nothing if called w/ undefined', () => {
//       expect(() => badWriteHandler(undefined)).to.throw;
//     })
//     it ('throws if called', () => {
//       const err = new Error('Bad Write');
//       expect(() => badWriteHandler(err)).toThrowError(err);
//     })
//   })
//   it ('writes file', () => {
//     const readFileStub = sinon.stub(fs, 'readFileSync').returns('{}');
//     utils.readFile('test');
//     expect(readFileStub.calledOnce).toBe(true);
//     readFileStub.reset();
//   })
// })
