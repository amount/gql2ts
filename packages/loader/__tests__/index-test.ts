import * as fs from 'fs';
import compiler from './compiler';
import mutationSchema from '../../../__tests__/shared/mutationSchema';
import querySchema from '../../../__tests__/shared/simpleSchema';

describe('Loader', () => {
  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('Mutation', () => {
    [
      'mutationNoArgs',
      'mutationMultipleArgs',
      'mutationInputArg',
      'mutationInputArgNotNull'
    ].forEach((mutationFile) => {
      describe(mutationFile, () => {
        it('loads graphql file', async () => {
          let fileOutput: string;
          const fsSpy: jest.Mock<any> = jest
            .spyOn(fs, 'writeFileSync')
            .mockImplementationOnce((file, data) => {
              fileOutput = data.toString();
            });

          const stats: any = await compiler(`./graphql/${mutationFile}.graphql`, { schema: mutationSchema } );
          const output: string = stats.toJson().modules[0].source;

          expect(fsSpy).toHaveBeenCalledTimes(1);
          fsSpy.mockClear();
          expect(fileOutput).toMatchSnapshot();
          expect(output).toMatchSnapshot();
        });
      });
    });
  });

  describe('Query', () => {
    [
      'query',
      'queryWithTypename',
      'queryWithVariable',
      'queryWithArray',
      'queryWithVariable',
      'anonQuery',
      'nakedQuery',
      'unionQuery',
      'unionQueryWithFragment'
    ].forEach((queryFile) => {
      describe(queryFile, () => {
        it('loads graphql file', async () => {
          let fileOutput: string;
          const fsSpy: jest.Mock<any> = jest
            .spyOn(fs, 'writeFileSync')
            .mockImplementationOnce((file, data) => {
              fileOutput = data.toString();
            });

          const stats: any = await compiler(`./graphql/${queryFile}.graphql`, { schema: querySchema } );
          const output: string = stats.toJson().modules[0].source;

          expect(fsSpy).toHaveBeenCalledTimes(1);
          fsSpy.mockClear();
          expect(fileOutput).toMatchSnapshot();
          expect(output).toMatchSnapshot();
        });
      });
    });

    describe('with custom typeMap and options', () => {
      it('loads graphql file', async () => {
        let fileOutput: string;
        const fsSpy: jest.Mock<any> = jest
          .spyOn(fs, 'writeFileSync')
          .mockImplementationOnce((file, data) => {
            fileOutput = data.toString();
          });
        const generateSubTypeInterfaceName: () => null = () => null;

        const stats: any = await compiler(
          `./graphql/customScalarQuery.graphql`,
          {
            schema: querySchema,
            typeMap: { TestScalar: 'string' },
            options: { generateSubTypeInterfaceName }
          }
        );
        const output: string = stats.toJson().modules[0].source;

        expect(fsSpy).toHaveBeenCalledTimes(1);
        fsSpy.mockClear();
        expect(fileOutput).toMatchSnapshot();
        expect(output).toMatchSnapshot();
      });
    });
  });
});
