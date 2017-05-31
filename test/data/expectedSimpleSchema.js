module.exports = `interface IGraphQLResponseRoot {
  data?: IQuery;
  errors?: Array<IGraphQLResponseError>;
}

interface IGraphQLResponseError {
  message: string;            // Required for all errors
  locations?: Array<IGraphQLResponseErrorLocation>;
  [propName: string]: any;    // 7.2.2 says 'GraphQL servers may provide additional entries to error'
}

interface IGraphQLResponseErrorLocation {
  line: number;
  column: number;
}

/*
  description: 
*/
interface IQuery {
  __typename: string;
  heroNoParam: Character | null;
  hero: Character | null;
  human: IHuman | null;
  droid: IDroid | null;
  test: any | null;
  humanOrDroid: HumanOrDroid | null;
  getCharacters: Array<Character>;
}

/*
  description: 
*/
type Character = IHuman | IDroid;

/*
  description: 
*/
interface ICharacter {
  __typename: string;
  id: string;
  name: string | null;
  friends: Array<Character> | null;
  appearsIn: Array<IEpisodeEnum> | null;
  nonNullArr: Array<Character>;
  nonNullArrAndContents: Array<Character>;
  nullArrNonNullContents: Array<Character>;
}

/*
  description: 
*/
type IEpisodeEnum = 'NEWHOPE' | 'EMPIRE' | 'JEDI';

/*
  description: 
*/
interface IHuman {
  __typename: string;
  id: string;
  name: string | null;
  friends: Array<Character> | null;
  appearsIn: Array<IEpisodeEnum> | null;
  homePlanet: string | null;
  nonNullArr: Array<Character>;
  nonNullArrAndContents: Array<Character>;
  nullArrNonNullContents: Array<Character>;
}

/*
  description: 
*/
interface IDroid {
  __typename: string;
  id: string;
  name: string | null;
  friends: Array<Character> | null;
  appearsIn: Array<IEpisodeEnum> | null;
  primaryFunction: string | null;
  primaryFunctionNonNull: string;
  nonNullArr: Array<Character>;
  nonNullArrAndContents: Array<Character>;
  nullArrNonNullContents: Array<Character>;
}

/*
  description: 
*/
type HumanOrDroid = IHuman | IDroid;

`;
