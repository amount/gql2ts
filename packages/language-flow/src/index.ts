import { IFromQueryOptions, WrapType } from '@gql2ts/types';
import { DEFAULT_OPTIONS as TS_OPTIONS } from '@gql2ts/language-typescript';

export const FLOW_WRAP_PARTIAL: WrapType = partial => `$SHAPE<${partial}>`;

export const DEFAULT_OPTIONS: IFromQueryOptions = {
  ...TS_OPTIONS,
  wrapPartial: FLOW_WRAP_PARTIAL
};
export default DEFAULT_OPTIONS;
