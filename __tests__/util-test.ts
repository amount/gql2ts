import * as fs from 'fs';
import * as utils from '../packages/util';
import { badWriteHandler } from '../packages/util/dist/fileIO';
import schemaLanguage from './shared/simpleSchema';
import { GraphQLSchema, introspectionQuery, graphql } from 'graphql';

const builtSchema: GraphQLSchema = utils.schemaFromInputs(schemaLanguage);

describe('schema', () => {
  it('works with schema language', () => {
    expect(builtSchema).toBeInstanceOf(GraphQLSchema);
  });

  describe('introspection query', () => {
    const promised: Promise<any> = graphql(builtSchema, introspectionQuery);

    it('works with introspected query in data key', () =>
      expect(
        promised.then(r => utils.schemaFromInputs(r))
      ).resolves.toBeInstanceOf(GraphQLSchema));

    it('works with introspected query in data key', () =>
      expect(
        promised.then(r => utils.schemaFromInputs(r.data))
      ).resolves.toBeInstanceOf(GraphQLSchema));
  });

  it('works with a schema', () => {
    expect(utils.schemaFromInputs(builtSchema)).toBeInstanceOf(GraphQLSchema);
  });

  it('throws on other', () => {
    expect(() => utils.schemaFromInputs({})).toThrowError(
      'Invalid Schema Input'
    );
  });
});

describe('IO stuff', () => {
  it('writes file', () => {
    // const writeFileStub = sinon.stub(fs, 'writeFile');
    const spy: jest.Spy = jest.spyOn(fs, 'writeFile').mockImplementation(() => null);
    utils.writeToFile('test', 'test');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy.mockRestore();
    spy.mockClear();
  });

  describe('error handler', () => {
    it('does nothing if called w/ undefined', () => {
      expect(() => badWriteHandler(undefined)).not.toThrow();
    });
    it('throws if called', () => {
      expect(() => badWriteHandler(err)).toThrowErrorMatchingSnapshot();
    });
  });
  it('writes file', () => {
    const spy: jest.Spy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{}');
    utils.readFile('test');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy.mockRestore();
    spy.mockClear();
  });
});
