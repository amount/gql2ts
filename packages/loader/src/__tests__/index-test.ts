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

describe('Loader', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fails if no schema is provided', async () => {
    const stats: Promise<Stats> = compiler(`./graphql/query.graphql`, {});
    await expect(stats).rejects.toThrow('Schema must be provided');
  });

  it('writes a declaration file', async () => {
    const RETURN_VALUE: string = 'GQL2TS RETURN VALUE';
    const FAKE_SCHEMA: PossibleSchemaInput = 'fake schema';

    const fsSpy: jest.Mock<typeof fs.writeFile> = jest
      .spyOn(fs, 'writeFile')
      .mockImplementationOnce((_file, data, callback) => {
        expect(data.toString()).toEqual(buildDeclaration(RETURN_VALUE));
        callback(null);
      });

    const gql2tsSpy: jest.Mock<typeof fromQuery.default> = jest
      .spyOn(fromQuery, 'default')
      .mockImplementationOnce(() => [{ result: RETURN_VALUE }]);

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
    const RETURN_VALUE: string = 'GQL2TS RETURN VALUE';
    const FAKE_SCHEMA: PossibleSchemaInput = 'fake schema';
    let typeMapValue: Partial<ITypeMap> = { Test: 'object', Test2: 'string' };
    let optionsValue: Partial<IProvidedOptions> = {
      wrapList: (type: string) => `wrapped(${type})`,
      generateSubTypeInterfaceName: () => null,
    };

    const fsSpy: jest.Mock<typeof fs.writeFile> = jest
      .spyOn(fs, 'writeFile')
      .mockImplementationOnce((_file, data, callback) => {
        expect(data.toString()).toEqual(buildDeclaration(RETURN_VALUE));
        callback(null);
      });

    const gql2tsSpy: jest.Mock<typeof fromQuery.default> = jest
      .spyOn(fromQuery, 'default')
      .mockImplementationOnce((_schema, _source, typeMap, options) => {
        expect(typeMap).toEqual(typeMapValue);
        expect(options).toEqual(optionsValue);
        return [{ result: RETURN_VALUE }];
      });

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
