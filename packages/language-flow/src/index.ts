import { IFromQueryOptions, WrapType } from '@gql2ts/types';
import { DEFAULT_OPTIONS as TS_OPTIONS } from '@gql2ts/language-typescript';

export const FLOW_WRAP_PARTIAL: WrapType = partial => `$SHAPE<${partial}>`;
export const FLOW_POST_PROCESSOR: WrapType = str => `/* @flow */

${str}
`;

export const DEFAULT_OPTIONS: IFromQueryOptions = {
  ...TS_OPTIONS,
  wrapPartial: FLOW_WRAP_PARTIAL,
  postProcessor: FLOW_POST_PROCESSOR
};
export default DEFAULT_OPTIONS;
