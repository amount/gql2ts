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

  it ('works 2', () => {
    expect(
      FromQuery(Schema, Query2)
    ).toMatchSnapshot();
  });
});
