import prettify from '../typescriptPrettify';

const tsString: string = `export interface ITestInterface { a:string;b:string|number;c:string|number|boolean; }`;

describe('typescript prettify', () => {
  it ('prettifies', () => {
    expect(prettify(tsString)).toMatchSnapshot();
  });
});
