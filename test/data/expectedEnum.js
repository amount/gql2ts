module.exports = `// graphql typescript definitions

declare module GQL {
  export interface IGraphQLResponseRoot {
    data?: IQuery;
    errors?: Array<IGraphQLResponseError>;
  }

  export interface IGraphQLResponseError {
    message: string;            // Required for all errors
    locations?: Array<IGraphQLResponseErrorLocation>;
    [propName: string]: any;    // 7.2.2 says 'GraphQL servers may provide additional entries to error'
  }

  export interface IGraphQLResponseErrorLocation {
    line: number;
    column: number;
  }

  /*
    description: null
  */
  export interface IQuery {
    __typename: string;
    colorEnum: IColorEnum;
  }

  /*
    description: null
  */
  export type IColorEnum = "RED" | "GREEN" | "BLUE";
}

export default GQL;
`
