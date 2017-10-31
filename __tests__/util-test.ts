import * as fs from 'fs';
import * as utils from '../packages/util/src';
import { badWriteHandler, safeJSONParse, readFile } from '../packages/util/src/fileIO';
import schemaLanguage from './shared/simpleSchema';
import { GraphQLSchema, introspectionQuery, graphql, GraphQLNonNull, GraphQLList, GraphQLEnumType, GraphQLString } from 'graphql';

const builtSchema: GraphQLSchema = utils.schemaFromInputs(schemaLanguage);

describe('schema', () => {
  describe('schemaFromInputs', () => {
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
      expect(() => utils.schemaFromInputs({} as any)).toThrowError(
        'Invalid Schema Input'
      );
    });
  });
  describe('utility functions', () => {
    describe('isNonNullable', () => {
      it('returns true for a non-null', () => {
        expect(utils.isNonNullable(new GraphQLNonNull(GraphQLString))).toBe(true);
      });

      it('returns false for nullable', () => {
        expect(utils.isNonNullable(GraphQLString)).toBe(false);
      });
    });

    describe('isList', () => {
      it('returns true for a list', () => {
        expect(utils.isList(new GraphQLList(GraphQLString))).toBe(true);
      });

      it('returns false for not list', () => {
        expect(utils.isList(GraphQLString)).toBe(false);
      });
    });

    describe('isEnum', () => {
      it('returns true for an enum', () => {
        expect(utils.isEnum(new GraphQLEnumType({
          name: 'testenum',
          values: {
            test: GraphQLString
          }
        }))).toBe(true);
      });

      it('returns false for non enum', () => {
        expect(utils.isEnum(GraphQLString)).toBe(false);
      });
    });
  });
});

describe('IO stuff', () => {
  it('writes file', () => {
    const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'writeFile').mockImplementation(() => null);
    utils.writeToFile('test', 'test');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy.mockClear();
    (spy as any).mockRestore();
  });

  describe('error handler', () => {
    it('does nothing if called w/ undefined', () => {
      expect(() => badWriteHandler(undefined)).not.toThrow();
    });
    it('throws if called', () => {
      expect(() => badWriteHandler(new Error('Error test'))).toThrowErrorMatchingSnapshot();
    });
  });
  it('writes file', () => {
    const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{}');
    utils.readFile('test');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy.mockClear();
    (spy as any).mockRestore();
  });

  describe('readFile', () => {
    it ('reads json', () => {
      const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{ "test": true }');
      expect(readFile('test.json')).toEqual({ test: true });
      spy.mockReset();
      spy.mockClear();
      (spy as any).mockRestore();
    });

    it ('reads strings', () => {
      const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'test');
      expect(readFile('test.gql')).toEqual('test');
      spy.mockReset();
      spy.mockClear();
      (spy as any).mockRestore();
    });
  });

  describe('safeJSONParse', () => {
    it ('falls back to string', () => {
      const input: string = 'test';
      expect(safeJSONParse(input)).toEqual(input);
    });
    it ('parses json', () => {
      const input: string = '{ "test": true }';
      expect(safeJSONParse(input)).toEqual({ test: true });
    });
  });
});
