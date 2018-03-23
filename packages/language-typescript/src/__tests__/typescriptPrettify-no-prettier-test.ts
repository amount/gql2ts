jest.mock('prettier', () => { throw new Error('Prettier not installed!'); });

import prettify, { PRETTY_PRINT_WARNING } from '../typescriptPrettify';

const tsString: string = `export interface ITestInterface { a:string;b:string|number;c:string|number|boolean; }`;

describe('typescript prettify', () => {
  it ('succeeds if prettier is missing', () => {
    const spy: jest.SpyInstance<(message: any, ...args: any[]) => void> = jest.spyOn(console, 'warn');
    expect(prettify(tsString)).toMatchSnapshot();
    prettify(tsString);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(PRETTY_PRINT_WARNING);
  });
});
