import * as fs from 'fs';
import * as utils from '../packages/util/src';
import { badWriteHandler, safeJSONParse, readFile } from '../packages/util/src/fileIO';
import schemaLanguage from './shared/simpleSchema';
import { GraphQLSchema, introspectionQuery, graphql, GraphQLNonNull, GraphQLList, GraphQLEnumType, GraphQLString, GraphQLUnionType } from 'graphql';

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

    describe('isUnion', () => {
      it('returns true for an union', () => {
        expect(utils.isUnion(new GraphQLUnionType({
          name: 'testenum',
          types: []
        }))).toBe(true);
      });

      it('returns false for non union', () => {
        expect(utils.isUnion(GraphQLString)).toBe(false);
      });
    });

    describe('isScalar', () => {
      it('returns true for an scalar', () => {
        expect(utils.isScalar(GraphQLString)).toBe(true);
      });

      it('returns false for non scalar', () => {
        expect(utils.isScalar(new GraphQLUnionType({
          name: 'fakeenum',
          types: []
        }))).toBe(false);
      });
    });
  });
});

describe('IO stuff', () => {
  it('writes file', () => {
    const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'writeFile').mockImplementation(() => null);
    utils.writeToFile('test', 'test');
    expect(spy).toHaveBeenCalledTimes(1);
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
    (spy as any).mockRestore();
  });

  describe('readFile', () => {
    it ('reads json', () => {
      const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{ "test": true }');
      expect(readFile('test.json')).toEqual({ test: true });
      (spy as any).mockRestore();
    });

    it ('reads strings', () => {
      const spy: jest.MockInstance<{}> = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'test');
      expect(readFile('test.gql')).toEqual('test');
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

describe('parser', () => {
  describe('with description', () => {
    it ('without any tags', () => {
      expect(
        utils.buildDocumentation({
          description: 'This field is something useful'
        } as any)
      ).toMatchSnapshot();
    });

    it ('with default tag', () => {
      expect(
        utils.buildDocumentation({
          description: 'This field is something useful',
          defaultValue: 'abc'
        } as any)
      ).toMatchSnapshot();
    });

    it ('with deprecated tag w/o reason', () => {
      expect(
        utils.buildDocumentation({
          description: 'This field is something useful',
          isDeprecated: true,
          deprecationReason: undefined
        } as any)
      ).toMatchSnapshot();
    });

    it ('with deprecated tag w/ reason', () => {
      expect(
        utils.buildDocumentation({
          description: 'This field is something useful',
          isDeprecated: true,
          deprecationReason: 'Use the other field instead!'
        } as any)
      ).toMatchSnapshot();
    });
    describe('the unlikely default value & deprecated', () => {
      it ('w/o deprecation reason', () => {
        expect(
          utils.buildDocumentation({
            description: 'This field is something useful',
            defaultValue: 'abc',
            isDeprecated: true,
            deprecationReason: undefined
          } as any)
        ).toMatchSnapshot();
      });

      it ('w/ deprecation reason', () => {
        expect(
          utils.buildDocumentation({
            description: 'This field is something useful',
            defaultValue: 'abc',
            isDeprecated: true,
            deprecationReason: 'Use the other field instead!'
          } as any)
        ).toMatchSnapshot();
      });
    });
  });

  describe('without description', () => {
    it ('without any tags', () => {
      expect(
        utils.buildDocumentation({        } as any)
      ).toMatchSnapshot();
    });

    it ('with default tag', () => {
      expect(
        utils.buildDocumentation({
          defaultValue: 'abc'
        } as any)
      ).toMatchSnapshot();
    });

    it ('with deprecated tag w/o reason', () => {
      expect(
        utils.buildDocumentation({
          isDeprecated: true,
          deprecationReason: undefined
        } as any)
      ).toMatchSnapshot();
    });

    it ('with deprecated tag w/ reason', () => {
      expect(
        utils.buildDocumentation({
          isDeprecated: true,
          deprecationReason: 'Use the other field instead!'
        } as any)
      ).toMatchSnapshot();
    });
    describe('the unlikely default value & deprecated', () => {
      it ('w/o deprecation reason', () => {
        expect(
          utils.buildDocumentation({
            defaultValue: 'abc',
            isDeprecated: true,
            deprecationReason: undefined
          } as any)
        ).toMatchSnapshot();
      });

      it ('w/ deprecation reason', () => {
        expect(
          utils.buildDocumentation({
            defaultValue: 'abc',
            isDeprecated: true,
            deprecationReason: 'Use the other field instead!'
          } as any)
        ).toMatchSnapshot();
      });
    });
  });
});

describe('utils', () => {
  describe('filterAndJoinArray', () => {
    describe('with default joinChar', () => {
      it ('with empty array', () => {
        expect(utils.filterAndJoinArray([])).toMatchSnapshot();
      });
      it ('with array length 1', () => {
        expect(utils.filterAndJoinArray(['hi'])).toMatchSnapshot();
      });
      it ('with array length > 1', () => {
        expect(utils.filterAndJoinArray(['hi', 'there', 'hello'])).toMatchSnapshot();
      });
      it ('with array length > 1 w/ undefined, false, and null', () => {
        expect(utils.filterAndJoinArray(['hi', 'there', 'hello', undefined, null, false, 'woah!'])).toMatchSnapshot();
      });
      it ('with only falsy values', () => {
        expect(utils.filterAndJoinArray([undefined, null, false])).toMatchSnapshot();
      });
      it ('with falsy values & 1 truthy', () => {
        expect(utils.filterAndJoinArray([undefined, null, 'hi', false])).toMatchSnapshot();
      });
    });
    describe('with alternative joinChar', () => {
      it ('with empty array', () => {
        expect(utils.filterAndJoinArray([], '\t')).toMatchSnapshot();
      });
      it ('with array length 1', () => {
        expect(utils.filterAndJoinArray(['hi'], '\t')).toMatchSnapshot();
      });
      it ('with array length > 1', () => {
        expect(utils.filterAndJoinArray(['hi', 'there', 'hello'], '\t')).toMatchSnapshot();
      });
      it ('with array length > 1 w/ undefined, false, and null', () => {
        expect(utils.filterAndJoinArray(['hi', 'there', 'hello', undefined, null, false, 'woah!'], '\t')).toMatchSnapshot();
      });
      it ('with only falsy values', () => {
        expect(utils.filterAndJoinArray([undefined, null, false], '\t')).toMatchSnapshot();
      });
      it ('with falsy values & 1 truthy', () => {
        expect(utils.filterAndJoinArray([undefined, null, 'hi', false], '\t')).toMatchSnapshot();
      });
    });
  });
});
