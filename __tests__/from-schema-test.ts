import { schemaToInterfaces, generateNamespace } from '../packages/from-schema/src';
import { DEFAULT_OPTIONS } from '../packages/language-typescript/src';
import schema from './data/starWarsSchema';
import enumSchema from './data/enumSchema';
import simpleSchema from './shared/simpleSchema';
import mutationSchema from './shared/mutationSchema';

const { postProcessor } = DEFAULT_OPTIONS;

const schemaAsAny: any = schema;
const enumSchemaAsAny: any = enumSchema;

describe('gql2ts', () => {
  describe('interfaces', () => {
    it('correctly translates the star wars schema into typescript defs', () => {
      const actual: string = schemaToInterfaces(schemaAsAny, {
        ignoredTypes: []
      });
      expect(actual).toMatchSnapshot();
    });

    it('correctly ignores types', () => {
      const actual: string = schemaToInterfaces(schemaAsAny, {
        ignoredTypes: ['Person']
      });
      expect(actual).toMatchSnapshot();
    });

    it('correctly translates enums', () => {
      const actual: string = schemaToInterfaces(enumSchemaAsAny, {
        ignoredTypes: []
      });
      expect(actual).toMatchSnapshot();
    });
  });

  describe('namespace', () => {
    it('correctly generates namespace', () => {
      const namespace: string = generateNamespace('GQL', schemaAsAny, {
        ignoredTypes: []
      });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly uses a custom namespace', () => {
      const namespace: string = generateNamespace('StarWars', schemaAsAny, {
        ignoredTypes: []
      });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly uses a namespace and ignores', () => {
      const namespace: string = generateNamespace('StarWars', schemaAsAny, {
        ignoredTypes: ['Person']
      });
      expect(namespace).toMatchSnapshot();
    });

    it('correctly translates enums', () => {
      const namespace: string = generateNamespace('GQL', enumSchemaAsAny, {
        ignoredTypes: []
      });

      expect(namespace).toMatchSnapshot();
    });
  });

  describe('union types', () => {
    it('correctly translates the schema into typescript defs', () => {
      const actual: string = schemaToInterfaces(simpleSchema, {
        ignoredTypes: []
      });
      expect(actual).toMatchSnapshot();
    });
  });

  describe('Supports older TypeScript versions', () => {
    it('removes Nullability annotations when passed', () => {
      const interfaces: string = schemaToInterfaces(schemaAsAny, {
        ignoredTypes: [],
        legacy: true
      });
      expect(interfaces).toMatchSnapshot();
    });
  });

  describe('mutations', () => {
    it('supports mutations', () => {
      const actual: string = schemaToInterfaces(mutationSchema, {
        ignoredTypes: []
      });
      expect(actual).toMatchSnapshot();
    });
  });

  describe('deprecation', () => {
    it('removes deprecated fields if requested', () => {
      const actual: string = schemaToInterfaces(simpleSchema, {
        ignoredTypes: [],
        excludeDeprecatedFields: true
      });
      expect(actual).toMatchSnapshot();
    });
  });
});
