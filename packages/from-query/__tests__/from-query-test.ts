import Query from './data/query';
import Schema from './data/schema';
import FromQuery from '../src/index';

/**
 * original source: https://github.com/BinaryMuse/gql2ts-bug
 */
describe('additional fragments', () => {
  it ('generates a proper interface', () => {
    expect(
      FromQuery(Schema, Query)
    ).toMatchSnapshot();
  });
});
