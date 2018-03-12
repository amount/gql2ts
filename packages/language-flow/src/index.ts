import { IFromQueryOptions, WrapType, EnumTypeBuilder, EnumFormatter } from '@gql2ts/types';
import { DEFAULT_OPTIONS as TS_OPTIONS } from '@gql2ts/language-typescript';
import { filterAndJoinArray } from '@gql2ts/util';

export const FLOW_WRAP_PARTIAL: WrapType = partial => `$SHAPE<${partial}>`;
export const FLOW_POST_PROCESSOR: WrapType = str => `/* @flow */

${str}
`;

export const FLOW_ENUM_TYPE: EnumTypeBuilder = (name, values) => `type ${name} = ${values}`;

export const FLOW_FORMAT_ENUM: EnumFormatter = values => filterAndJoinArray(
  values.map(({ name }) => `'${name}'`), ' | '
);

export const DEFAULT_OPTIONS: IFromQueryOptions = {
  ...TS_OPTIONS,
  wrapPartial: FLOW_WRAP_PARTIAL,
  postProcessor: FLOW_POST_PROCESSOR,
  enumTypeBuilder: FLOW_ENUM_TYPE,
  formatEnum: FLOW_FORMAT_ENUM
};
export default DEFAULT_OPTIONS;
