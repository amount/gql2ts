/**
 * Here's a very basic TypeScript Prettifier.
 * Source: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API/15573be582511aeac9c1f4047d6b02ec829088cd
 * Default Options from:
 *  https://github.com/vvakame/typescript-formatter/tree/a49f0949c9760530365c5b874cf0e979bd010a04#read-settings-from-files
 */
import { format as prettierFormat } from 'prettier';

let hasWarned: boolean = false;

export const PRETTY_PRINT_WARNING: string = 'To enable pretty-printing, please install prettier';

const format: (text: string) => string = text => {
  try {
    // tslint:disable no-require-imports
    const { format: formatter }: { format: typeof prettierFormat } = require('prettier');
    return formatter(text, {
      bracketSpacing: true,
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
    });
  } catch (e) {
    if (!hasWarned) {
      console.warn(PRETTY_PRINT_WARNING);
      hasWarned = true;
    }
    return text;
  }
};

export default format;
