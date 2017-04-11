/**
 * Here's a very basic TypeScript Prettifier.
 * Source: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API/15573be582511aeac9c1f4047d6b02ec829088cd
 * Default Options from:
 *  https://github.com/vvakame/typescript-formatter/tree/a49f0949c9760530365c5b874cf0e979bd010a04#read-settings-from-files
 */

import * as ts from 'typescript';

const TYPESCRIPT_OPTIONS: any = {
  baseIndentSize: 0,
  indentSize: 2,
  tabSize: 2,
  indentStyle: 2,
  newLineCharacter: '\n',
  convertTabsToSpaces: true,
  insertSpaceAfterCommaDelimiter: true,
  insertSpaceAfterSemicolonInForStatements: true,
  insertSpaceBeforeAndAfterBinaryOperators: true,
  insertSpaceAfterConstructor: false,
  insertSpaceAfterKeywordsInControlFlowStatements: true,
  insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
  insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
  insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
  insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
  insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
  insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
  insertSpaceAfterTypeAssertion: false,
  insertSpaceBeforeFunctionParenthesis: false,
  placeOpenBraceOnNewLineForFunctions: false,
  placeOpenBraceOnNewLineForControlBlocks: false
};

const RULE_PROVIDER: any = new (ts as any).formatting.RulesProvider();
RULE_PROVIDER.ensureUpToDate(TYPESCRIPT_OPTIONS);

const applyEdits: (text: string, edits: ts.TextChange[]) => string = (text, edits) => {
  let result: string = text;
  for (let i: number = edits.length - 1; i >= 0; i--) {
    let change: ts.TextChange = edits[i];
    result = result.slice(0, change.span.start) + change.newText + result.slice(change.span.start + change.span.length);
  }
  return result;
};

const format: (text: string) => string = text => {
  const sourceFile: ts.SourceFile = ts.createSourceFile('temp.ts', text, ts.ScriptTarget.Latest, true);

  const edits: ts.TextChange[] = (ts as any).formatting.formatDocument(sourceFile, RULE_PROVIDER, TYPESCRIPT_OPTIONS);

  return applyEdits(text, edits);
};

export default format;
