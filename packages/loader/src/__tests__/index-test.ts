import * as fs from 'fs';
import * as path from 'path';
import { Stats } from 'webpack';
import * as fromQuery from '@gql2ts/from-query';
import { PossibleSchemaInput } from '@gql2ts/util';
import { ITypeMap, IProvidedOptions } from '@gql2ts/types';
import compiler from './__helpers__/compiler';
import buildDeclaration from '../buildDeclaration';

const SOURCE: string = fs
  .readFileSync(path.resolve(__dirname, './graphql/query.graphql'))
  .toString();

const RETURN_VALUE: string = 'GQL2TS RETURN VALUE';
const FAKE_SCHEMA: PossibleSchemaInput = 'fake schema';

let fsSpy: jest.Mock<typeof fs.writeFile>;
let gql2tsSpy: jest.Mock<typeof fromQuery.default>;

describe('Loader', () => {
  beforeEach(() => {
    fsSpy = jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((_file, data, callback) => {
        expect(data.toString()).toEqual(buildDeclaration(RETURN_VALUE));
        callback(null);
      });

    gql2tsSpy = jest
      .spyOn(fromQuery, 'default')
      .mockImplementation(() => [{ result: RETURN_VALUE }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fails if no schema is provided', async () => {
    const stats: Promise<Stats> = compiler(`./graphql/query.graphql`, {});
    await expect(stats).rejects.toThrow('Schema must be provided');
    expect(fsSpy).not.toHaveBeenCalled();
    expect(gql2tsSpy).not.toHaveBeenCalled();
  });

  it('writes a declaration file', async () => {
    await compiler(`./graphql/query.graphql`, {
      schema: FAKE_SCHEMA,
    });

    expect(fsSpy).toHaveBeenCalledTimes(1);
    expect(gql2tsSpy).toHaveBeenCalledTimes(1);
    expect(gql2tsSpy).toHaveBeenCalledWith(
      FAKE_SCHEMA,
      SOURCE,
      undefined,
      undefined,
    );
  });

  it('writes a declaration file using typeMap and options', async () => {
    let typeMapValue: Partial<ITypeMap> = { Test: 'object', Test2: 'string' };
    let optionsValue: Partial<IProvidedOptions> = {
      wrapList: (type: string) => `wrapped(${type})`,
      generateSubTypeInterfaceName: () => null,
    };

    await compiler(`./graphql/query.graphql`, {
      schema: FAKE_SCHEMA,
      typeMap: typeMapValue,
      options: optionsValue
    });

    expect(fsSpy).toHaveBeenCalledTimes(1);
    expect(gql2tsSpy).toHaveBeenCalledTimes(1);
    expect(gql2tsSpy).toHaveBeenCalledWith(
      FAKE_SCHEMA,
      SOURCE,
      typeMapValue,
      optionsValue,
    );
  });
});
