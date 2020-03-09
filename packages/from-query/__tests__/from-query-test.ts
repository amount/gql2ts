import { introspectionQuery } from 'graphql';

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

  // it ('works 2', () => {
  //   expect(
  //     FromQuery(Schema, Query2)
  //   ).toMatchSnapshot();
  // });

  // it('works with the introspection query', () => {
  //   expect(
  //     FromQuery(Schema, introspectionQuery)
  //   ).toMatchSnapshot();
  // });

  // it('works with another introspective query', () => {
  //   expect(
  //     FromQuery(Schema, `query {
  //       __type(name: "String") {
  //         kind
  //       }
  //       t1: __type(name: "Boolean") {
  //         name
  //       }
  //       t2: __type(name: "Float") {
  //         kind
  //         name
  //       }
  //     }`)
  //   ).toMatchSnapshot();
  // });
});
