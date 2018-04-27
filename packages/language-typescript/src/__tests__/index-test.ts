import {
  interfaceExtendListToString,
  DEFAULT_NAME_QUERY,
  DEFAULT_FORMAT_INPUT,
  DEFAULT_TYPE_PRINTER,
  DEFAULT_ENUM_FORMATTER,
  DEFAULT_ENUM_TYPE_BUILDER,
  DEFAULT_ENUM_NAME_GENERATOR,
  DEFAULT_DOCUMENTATION_GENERATOR,
} from '../';
import { GraphQLEnumValue } from 'graphql';

describe('language-typescript', () => {
  describe('interfaceExtendListToString', () => {
    it('with non-empty array', () => {
      expect(
        interfaceExtendListToString(['test', 'test2', 'test3'])
      ).toMatchSnapshot();
    });
    it('with empty array', () => {
      expect(interfaceExtendListToString([])).toMatchSnapshot();
    });
  });

  describe('DEFAULT_NAME_QUERY', () => {
    it('anonymous', () => {
      expect(DEFAULT_NAME_QUERY({} as any)).toMatchSnapshot();
    });
    it('with name', () => {
      expect(
        DEFAULT_NAME_QUERY({ name: { value: 'test' } } as any)
      ).toMatchSnapshot();
    });
  });

  describe('DEFAULT_FORMAT_INPUT', () => {
    it('non optional', () => {
      expect(DEFAULT_FORMAT_INPUT('test', false, 'test2')).toMatchSnapshot();
    });
    it('optional', () => {
      expect(DEFAULT_FORMAT_INPUT('test', true, 'test2')).toMatchSnapshot();
    });
  });

  describe('DEFAULT_TYPE_PRINTER', () => {
    it('non null', () => {
      expect(DEFAULT_TYPE_PRINTER('test', false)).toMatchSnapshot();
    });
    it('null', () => {
      expect(DEFAULT_TYPE_PRINTER('test', true)).toMatchSnapshot();
    });
  });

  describe('DEFAULT_ENUM_FORMATTER', () => {
    it('w/o description', () => {
      expect(
        DEFAULT_ENUM_FORMATTER(
          [
            { name: 'a' } as GraphQLEnumValue,
            { name: 'b' } as GraphQLEnumValue,
          ],
          DEFAULT_DOCUMENTATION_GENERATOR
        )
      ).toMatchSnapshot();
    });
    it('w/ description', () => {
      expect(
        DEFAULT_ENUM_FORMATTER(
          [
            { name: 'a', description: 'value A' } as GraphQLEnumValue,
            { name: 'b' } as GraphQLEnumValue,
          ],
          DEFAULT_DOCUMENTATION_GENERATOR
        )
      ).toMatchSnapshot();
    });
    it('w/ deprecated value', () => {
      expect(
        DEFAULT_ENUM_FORMATTER(
          [
            { name: 'a', description: 'value A', deprecationReason: 'Bad', isDeprecated: true } as GraphQLEnumValue,
            { name: 'b', deprecationReason: 'Bad', isDeprecated: true } as GraphQLEnumValue,
            { name: 'c', description: 'value C'} as GraphQLEnumValue,
            { name: 'd' } as GraphQLEnumValue,
            { name: 'e', isDeprecated: false } as GraphQLEnumValue,
          ],
          DEFAULT_DOCUMENTATION_GENERATOR
        )
      ).toMatchSnapshot();
    });
  });

  describe('DEFAULT_ENUM_TYPE_BUILDER', () => {
    it('formats properly', () => {
      expect(DEFAULT_ENUM_TYPE_BUILDER(
        DEFAULT_ENUM_NAME_GENERATOR('test'),
        DEFAULT_ENUM_FORMATTER(
          [
            { name: 'a' } as GraphQLEnumValue,
            { name: 'b' } as GraphQLEnumValue,
          ],
          DEFAULT_DOCUMENTATION_GENERATOR
        ))
      ).toMatchSnapshot();
    });
  });

  describe('DEFAULT_DOCUMENTATION_GENERATOR', () => {
    describe('with a description', () => {
      it('without tags', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          description: 'This is a thing',
          tags: []
        })).toMatchSnapshot();
      });
      it('with 1 tag', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          description: 'This is a thing',
          tags: [{ tag: 'default', value: 'myDefaultValue' }]
        })).toMatchSnapshot();
      });
      it('with >1 tag', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          description: 'This is a thing',
          tags: [
            { tag: 'default', value: 'myDefaultValue' },
            { tag: 'deprecated', value: 'Use the other field instead' }
          ]
        })).toMatchSnapshot();
      });
    });

    describe('without a description', () => {
      it('without tags', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          tags: []
        })).toMatchSnapshot();
      });
      it('with 1 tag', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          tags: [{ tag: 'default', value: 'myDefaultValue' }]
        })).toMatchSnapshot();
      });
      it('with >1 tag', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
          tags: [
            { tag: 'default', value: 'myDefaultValue' },
            { tag: 'deprecated', value: 'Use the other field instead' }
          ]
        })).toMatchSnapshot();
      });
    });

    describe('with default values', () => {
      it('with default value as an object', () => {
        expect(DEFAULT_DOCUMENTATION_GENERATOR({
            description: 'This is a thing',
            tags: [{tag: 'default', value: JSON.stringify({number: 1, string: "string"})}]
        })).toMatchSnapshot();
      });
    });
  });
});
