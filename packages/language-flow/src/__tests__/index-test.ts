import {
  FLOW_ENUM_TYPE,
  FLOW_FORMAT_ENUM,
  FLOW_POST_PROCESSOR,
  FLOW_WRAP_PARTIAL
} from '../';
import { GraphQLEnumValue } from 'graphql';

describe('language-flow', () => {
  describe('FLOW_FORMAT_ENUM', () => {
    it('w/o description', () => {
      expect(
        FLOW_FORMAT_ENUM(
          [
            { name: 'a' } as GraphQLEnumValue,
            { name: 'b' } as GraphQLEnumValue
          ],
          () => ''
        )
      ).toMatchSnapshot();
    });
    it('w/ description', () => {
      expect(
        FLOW_FORMAT_ENUM(
          [
            { name: 'a', description: 'value A' } as GraphQLEnumValue,
            { name: 'b' } as GraphQLEnumValue
          ],
          () => ''
        )
      ).toMatchSnapshot();
    });
    it('w/ deprecated value', () => {
      expect(
        FLOW_FORMAT_ENUM(
          [
            {
              name: 'a',
              description: 'value A',
              deprecationReason: 'Bad',
              isDeprecated: true
            } as GraphQLEnumValue,
            {
              name: 'b',
              deprecationReason: 'Bad',
              isDeprecated: true
            } as GraphQLEnumValue,
            { name: 'c', description: 'value C' } as GraphQLEnumValue,
            { name: 'd' } as GraphQLEnumValue,
            { name: 'e', isDeprecated: false } as GraphQLEnumValue
          ],
          () => ''
        )
      ).toMatchSnapshot();
    });
  });

  describe('FLOW_ENUM_TYPE', () => {
    it('formats properly', () => {
      expect(
        FLOW_ENUM_TYPE(
          'Test',
          FLOW_FORMAT_ENUM(
            [
              { name: 'a' } as GraphQLEnumValue,
              { name: 'b' } as GraphQLEnumValue
            ],
            () => ''
          )
        )
      ).toMatchSnapshot();
    });
  });
});
