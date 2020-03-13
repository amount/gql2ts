// import { getIntrospectionQuery } from 'graphql';

import { Query1, Query2 } from './data/query';
import Schema from './data/schema';
import FromQuery from '../src/index';

/**
 * original source: https://github.com/BinaryMuse/gql2ts-bug
 */
describe('additional fragments', () => {
  it ('works 1', () => {
    expect(
      FromQuery(Schema, Query1)
    ).toMatchSnapshot();
  });

  // TODO: InlineFragment Must Be Inlined!
  // it ('works 2', () => {
  //   expect(
  //     FromQuery(Schema, Query2)
  //   ).toMatchSnapshot();
  // });

  // TODO: Introspection not supported yet
  // it('works with the introspection query', () => {
  //   const query: string = getIntrospectionQuery();

  //   expect(
  //     FromQuery(Schema, query)
  //   ).toMatchSnapshot();
  // });

  // TODO: Introspection not supported yet
  it('works with another introspective query', () => {
    const func: () => string = () =>
      FromQuery(
        Schema,
        `query {
          __type(name: "String") {
            kind
          }
          t1: __type(name: "Boolean") {
            name
          }
          t2: __type(name: "Float") {
            kind
            name
          }
        }`
      );

    expect(func).toThrowError('introspection not supported yet');
  });
});
