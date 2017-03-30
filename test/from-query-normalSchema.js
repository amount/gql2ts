const runProgram = require('../packages/from-query/index.js').default;
const schema = require('./shared/simpleSchema');
const expect = require('chai').expect;

const simplestQuery = `
  query TestQuery {
    heroNoParam {
      id
      name
    }
  }
`;
const simplestQueryResponse = [{
  variables: '',
  interface: `export interface TestQuery {
  heroNoParam: {
    id: string;
    name: string | null;
  } | null;
}`,
}];
const simpleQueryWithTypename = `
  query TestQuery {
    heroNoParam {
      __typename
      id
      name
    }
  }
`;
const simpleQueryWithTypenameExpected = `export interface TestQuery {
  heroNoParam: {
    __typename: string;
    id: string;
    name: string | null;
  } | null;
}`;

const variableQuery = `
  query TestQuery ($id: String!) {
    human (id: $id) {
      id
      name
    }
  }
`;
const variableExpectedResponse = [{
  variables: 'export interface TestQueryInput {\n  id: string;\n}',
  interface: `export interface TestQuery {
  human: {
    id: string;
    name: string | null;
  } | null;
}`,
}];
const variableArrayQuery = `
  query TestQuery ($ids: [ID!]!) {
    getCharacters (ids: $ids) {
      id
      name
    }
  }
`;
const variableArrayExpectedResponse = [{
  variables: 'export interface TestQueryInput {\n  ids: Array<string>;\n}',
  interface: `export interface TestQuery {
  getCharacters: Array<{
    id: string;
    name: string | null;
  } | null>;
}`,
}];

const arrTest = `
query Test {
  heroNoParam {
    nonNullArr {
      id
      name
    }
    nonNullArrAndContents {
      id
      name
    }
    nullArrNonNullContents {
      id
      name
    }
  }
}
`

const arrInterface = `export interface Test {
  heroNoParam: {
    nonNullArr: Array<{
      id: string;
      name: string | null;
    } | null>;
    nonNullArrAndContents: Array<{
      id: string;
      name: string | null;
    }>;
    nullArrNonNullContents: Array<{
      id: string;
      name: string | null;
    }> | null;
  } | null;
}`

const enumQuery = `
query EnumQuery($episode: Episode) {
  hero(episode: $episode) {
    appearsIn
  }
}`

const enumResponse = {
  variables: `export interface EnumQueryInput {
  episode?: 'NEWHOPE' | 'EMPIRE' | 'JEDI' | null;
}`, interface: `export interface EnumQuery {
  hero: {
    appearsIn: Array<'NEWHOPE' | 'EMPIRE' | 'JEDI' | null> | null;
  } | null;
}`
}

const customScalarQuery = `
query CustomScalarQuery($test: TestScalar) {
  test (test: $test)
}
`;

const expectedCustomScalarResponse = {
  variables: 'export interface CustomScalarQueryInput {\n  test?: string | null;\n}',
  interface: 'export interface CustomScalarQuery {\n  test: string | null;\n}',
}

const UnionQuery = `
query UnionQuery($id: String!) {
  humanOrDroid (id: $id) {
    id
  }
}
`;

const expectedUnionResponse = {
  interface: 'export interface UnionQuery {\n  humanOrDroid: {\n    id: string;\n  } | null;\n}',
  variables: 'export interface UnionQueryInput {\n  id: string;\n}',
}

const UnionQueryWithFragment = `
query UnionQuery($id: String!) {
  humanOrDroid (id: $id) {
    ... on Human {
      id
    }

    ... on Droid {
      name
    }
  }
}
`;

const expectedUnionWithFragmentResponse = {
  interface: 'export interface UnionQuery {\n  humanOrDroid: {\n    id?: string;\n    name?: string | null;\n  } | null;\n}',
  variables: 'export interface UnionQueryInput {\n  id: string;\n}',
}

const anonQuery = `
  query {
    heroNoParam {
      id
      name
    }
  }
`;

const nakedQuery = `
  query {
    heroNoParam {
      id
      name
    }
  }
`;

const anonAndNakedResponse = `export interface Anonymous {
  heroNoParam: {
    id: string;
    name: string | null;
  } | null;
}`;
const generateSubTypeInterfaceName = () => null;
describe('simple examples', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(simplestQueryResponse[0].interface);
    expect(response[0].variables).to.equal(simplestQueryResponse[0].variables);
    expect(response.length).to.equal(1);
  });
  it ('does a very simple query', () => {
    const response = runProgram(schema, simpleQueryWithTypename, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(simpleQueryWithTypenameExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  });
  it ('does unnamed queries', () => {
    const response = runProgram(schema, anonQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(anonAndNakedResponse);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  });

  it ('does "naked" queries', () => {
    const response = runProgram(schema, nakedQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(anonAndNakedResponse);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  });

  it ('supports variables', () => {
    const response = runProgram(schema, variableQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(variableExpectedResponse[0].interface);
    expect(response[0].variables).to.equal(variableExpectedResponse[0].variables);
    expect(response.length).to.equal(1);
  });

  it ('supports list variables', () => {
    const response = runProgram(schema, variableArrayQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(variableArrayExpectedResponse[0].interface);
    expect(response[0].variables).to.equal(variableArrayExpectedResponse[0].variables);
    expect(response.length).to.equal(1);
  });

  it ('supports arrays', () => {
    const response = runProgram(schema, arrTest, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(arrInterface);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  });

  it ('supports enums', () => {
    const response = runProgram(schema, enumQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(enumResponse.interface);
    expect(response[0].variables).to.equal(enumResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports custom scalars', () => {
    const response = runProgram(schema, customScalarQuery, { TestScalar: 'string' }, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(expectedCustomScalarResponse.interface);
    expect(response[0].variables).to.equal(expectedCustomScalarResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports unions', () => {
    const response = runProgram(schema, UnionQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(expectedUnionResponse.interface);
    expect(response[0].variables).to.equal(expectedUnionResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports unions with inline fragment', () => {
    const response = runProgram(schema, UnionQueryWithFragment, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(expectedUnionWithFragmentResponse.interface);
    expect(response[0].variables).to.equal(expectedUnionWithFragmentResponse.variables);
    expect(response.length).to.equal(1);
  })
});

const fragmentQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
}
`

const fragmentInterface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const fragmentInterface1 = 'export interface IFragmentCharacterFields {\n  id: string;\n}'

const nestedFragmentQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  friends {
    ...CharacterFieldsNested
  }
}

fragment CharacterFieldsNested on Character {
  id
}
`;

const nestedFragmentInterface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const nestedFragmentInterface1 = 'export interface IFragmentCharacterFields {\n  friends: Array<IFragmentCharacterFieldsNested | null> | null;\n}'
const nestedFragmentInterface2 = 'export interface IFragmentCharacterFieldsNested {\n  id: string;\n}'

const nestedFragment2Query = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  ...CharacterFieldsNested
  friends {
    ...CharacterFieldsNested
  }
}

fragment CharacterFieldsNested on Character {
  id
}
`;

const nestedFragment2Interface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const nestedFragment2Interface1 = 'export interface IFragmentCharacterFields extends IFragmentCharacterFieldsNested {\n  friends: Array<IFragmentCharacterFieldsNested | null> | null;\n}'
const nestedFragment2Interface2 = 'export interface IFragmentCharacterFieldsNested {\n  id: string;\n}'

const nestedFragment3Query = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  ...CharacterFieldsNested
  ...CharacterFieldsNestedAgain
  friends {
    ...CharacterFieldsNested
  }
}

fragment CharacterFieldsNested on Character {
  id
}
fragment CharacterFieldsNestedAgain on Character {
  name
}
`;

const nestedFragment3Interface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const nestedFragment3Interface1 = 'export interface IFragmentCharacterFields extends IFragmentCharacterFieldsNested, IFragmentCharacterFieldsNestedAgain {\n  friends: Array<IFragmentCharacterFieldsNested | null> | null;\n}'
const nestedFragment3Interface2 = 'export interface IFragmentCharacterFieldsNested {\n  id: string;\n}'
const nestedFragment3Interface3 = 'export interface IFragmentCharacterFieldsNestedAgain {\n  name: string | null;\n}'

const fragmentWithOtherSelectionQuery = `
query FragmentTest {
  heroNoParam {
    name
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
}
`

const fragmentWithOtherSelectionInterface0 = `export interface FragmentTest {\n  heroNoParam: {\n    name: string | null;\n  } & IFragmentCharacterFields | null;\n}`;
const fragmentWithOtherSelectionInterface1 = 'export interface IFragmentCharacterFields {\n  id: string;\n}'

const fragmentWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  b: id
}
`

const fragmentWithAliasInterface0 = `export interface FragmentTest {\n  a: IFragmentCharacterFields | null;\n}`;
const fragmentWithAliasInterface1 = 'export interface IFragmentCharacterFields {\n  b: string;\n}'

const fragmentWithOtherSelectionAndAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    b: name
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  c: id
}
`

const fragmentWithOtherSelectionAndAliasInterface0 = `export interface FragmentTest {\n  a: {\n    b: string | null;\n  } & IFragmentCharacterFields | null;\n}`;
const fragmentWithOtherSelectionAndAliasInterface1 = 'export interface IFragmentCharacterFields {\n  c: string;\n}'

const inlineFragmentQuery = `
query FragmentTest {
  heroNoParam {
    ... on Droid {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentExpected = `export interface FragmentTest {
  heroNoParam: {
    primaryFunction?: string | null;
    primaryFunctionNonNull?: string;
  } | null;
}`;

const inlineFragmentWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ... on Droid {
    	b: primaryFunction
      c: primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithAliasExpected = `export interface FragmentTest {
  a: {
    b?: string | null;
    c?: string;
  } | null;
}`;

const anonInlineFragmentQuery = `
query FragmentTest {
  heroNoParam {
    ... {
    	id
      name
    }
  }
}`;

const anonInlineFragmentExpected = `export interface FragmentTest {
  heroNoParam: {
    id: string;
    name: string | null;
  } | null;
}`;

const anonInlineFragmentWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ... {
    	b: id
      c: name
    }
  }
}`;

const anonInlineFragmentWithAliasExpected = `export interface FragmentTest {
  a: {
    b: string;
    c: string | null;
  } | null;
}`;

describe('fragments', () => {
  it ('does simple fragments', () => {
    const response = runProgram(schema, fragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(fragmentInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with other selections', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(fragmentWithOtherSelectionInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithOtherSelectionInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with aliases', () => {
    const response = runProgram(schema, fragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(fragmentWithAliasInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithAliasInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with other selections and aliases', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionAndAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(fragmentWithOtherSelectionAndAliasInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithOtherSelectionAndAliasInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does nested fragments', () => {
    const response = runProgram(schema, nestedFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(nestedFragmentInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(nestedFragmentInterface1);
    expect(response[1].variables).to.equal('');
    expect(response[2].interface).to.equal(nestedFragmentInterface2);
    expect(response[2].variables).to.equal('');
    expect(response.length).to.equal(3);
  })

  it ('does nested fragments 2', () => {
    const response = runProgram(schema, nestedFragment2Query, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(nestedFragment2Interface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(nestedFragment2Interface1);
    expect(response[1].variables).to.equal('');
    expect(response[2].interface).to.equal(nestedFragment2Interface2);
    expect(response[2].variables).to.equal('');
    expect(response.length).to.equal(3);
  })

  it ('does nested fragments 3', () => {
    const response = runProgram(schema, nestedFragment3Query, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(nestedFragment3Interface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(nestedFragment3Interface1);
    expect(response[1].variables).to.equal('');
    expect(response[2].interface).to.equal(nestedFragment3Interface2);
    expect(response[2].variables).to.equal('');
    expect(response[3].interface).to.equal(nestedFragment3Interface3);
    expect(response[3].variables).to.equal('');
    expect(response.length).to.equal(4);
  })

  it ('does inline fragments on type', () => {
    const response = runProgram(schema, inlineFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(inlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does inline fragments on type with aliases', () => {
    const response = runProgram(schema, inlineFragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(inlineFragmentWithAliasExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does anonymous inline fragments', () => {
    const response = runProgram(schema, anonInlineFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(anonInlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does anonymous inline fragments with aliases', () => {
    const response = runProgram(schema, anonInlineFragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(anonInlineFragmentWithAliasExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })
})

const simplestQueryWithDirectives = `
  query TestQuery {
    heroNoParam {
      id @include(if: true)
      name @skip(if: true)
    }
  }
`;
const simplestQueryWithDirectivesExpected = `export interface TestQuery {
  heroNoParam: {
    id?: string;
    name?: string | null;
  } | null;
}`;

const simpleQueryBadDirectives = `
  query TestQuery {
    heroNoParam {
      id @nope(if: true)
      name @yep(if: true)
    }
  }
`;
const simpleQueryBadDirectivesExpected = `export interface TestQuery {
  heroNoParam: {
    id: string;
    name: string | null;
  } | null;
}`;

const fragmentWithDirectivesQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields @skip(if: true)
  }
}

fragment CharacterFields on Character {
  id
}
`

const fragmentWithDirectivesInterface0 = `export interface FragmentTest {\n  heroNoParam: Partial<IFragmentCharacterFields> | null;\n}`;
const fragmentWithDirectivesInterface1 = 'export interface IFragmentCharacterFields {\n  id: string;\n}'

const fragmentWithDirectiveWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ...CharacterFields @include(if: true)
  }
}

fragment CharacterFields on Character {
  b: id
}
`

const fragmentWithDirectiveWithAliasInterface0 = `export interface FragmentTest {\n  a: Partial<IFragmentCharacterFields> | null;\n}`;
const fragmentWithDirectiveWithAliasInterface1 = 'export interface IFragmentCharacterFields {\n  b: string;\n}'


const inlineFragmentWithDirectiveQuery = `
query FragmentTest {
  heroNoParam {
    ... on Droid @include(if: true) {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithDirectiveExpected = `export interface FragmentTest {
  heroNoParam: Partial<{
    primaryFunction?: string | null;
    primaryFunctionNonNull?: string;
  }> | null;
}`;

const inlineFragmentWithDirectiveWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ... on Droid @include(if: true) {
    	b: primaryFunction
      c: primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithDirectiveWithAliasExpected = `export interface FragmentTest {
  a: Partial<{
    b?: string | null;
    c?: string;
  }> | null;
}`;

const anonInlineFragmentWithDirectiveQuery = `
query FragmentTest {
  heroNoParam {
    ... @include(if: true) {
    	id
      name
    }
  }
}`;

const anonInlineFragmentWithDirectiveExpected = `export interface FragmentTest {
  heroNoParam: Partial<{
    id: string;
    name: string | null;
  }> | null;
}`;

const anonInlineFragmentWithDirectiveWithAliasQuery = `
query FragmentTest {
  a: heroNoParam {
    ... @include(if: true) {
    	b: id
      c: name
    }
  }
}`;

const anonInlineFragmentWithDirectiveWithAliasExpected = `export interface FragmentTest {
  a: Partial<{
    b: string;
    c: string | null;
  }> | null;
}`;

describe('directives', () => {
  it ('outputs bad directives', () => {
    const response = runProgram(schema, simpleQueryBadDirectives, undefined, { generateSubTypeInterfaceName });
    expect(response[0].interface).to.equal(simpleQueryBadDirectivesExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })
  describe('on fields', () => {
    it ('works with simple fields', () => {
      const response = runProgram(schema, simplestQueryWithDirectives, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(simplestQueryWithDirectivesExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    });
  });

  describe('fragments', () => {
    it ('works with fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectivesQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(fragmentWithDirectivesInterface0);
      expect(response[0].variables).to.equal('');
      expect(response[1].interface).to.equal(fragmentWithDirectivesInterface1);
      expect(response[1].variables).to.equal('');
      expect(response.length).to.equal(2);
    })

    it ('works with aliases on fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(fragmentWithDirectiveWithAliasInterface0);
      expect(response[0].variables).to.equal('');
      expect(response[1].interface).to.equal(fragmentWithDirectiveWithAliasInterface1);
      expect(response[1].variables).to.equal('');
      expect(response.length).to.equal(2);
    })

    it ('works with inline fragments on type', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(inlineFragmentWithDirectiveExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('works with inline fragments on type with aliases', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(inlineFragmentWithDirectiveWithAliasExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('does anonymous inline fragments', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(anonInlineFragmentWithDirectiveExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('does anonymous inline fragments with aliases', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response[0].interface).to.equal(anonInlineFragmentWithDirectiveWithAliasExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })
  })
})

const simpleQueryWithSubTypesResponse = {
  interface: 'export interface TestQuery {\n  heroNoParam: SelectionOnheroNoParam | null;\n}',
  variables: '',
  additionalTypes: [`export interface SelectionOnheroNoParam {\n  id: string;\n  name: string | null;\n}`]
}
const arrQueryWithSubTypesResponse = {
  interface: `export interface Test {\n  heroNoParam: SelectionOnheroNoParam | null;\n}`,
  variables: '',
  additionalTypes: [`export interface SelectionOnnonNullArr {
  id: string;
  name: string | null;
}`,
`export interface SelectionOnnonNullArrAndContents {
  id: string;
  name: string | null;
}`,
`export interface SelectionOnnullArrNonNullContents {
  id: string;
  name: string | null;
}`,
`export interface SelectionOnheroNoParam {
  nonNullArr: Array<SelectionOnnonNullArr | null>;
  nonNullArrAndContents: Array<SelectionOnnonNullArrAndContents>;
  nullArrNonNullContents: Array<SelectionOnnullArrNonNullContents> | null;
}`]
}

const fragmentPartialQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
  ... on Human {
    name
  }
}
`

const fragmentPartialInterface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const fragmentPartialInterface1 = 'export interface IFragmentCharacterFields {\n  id: string;\n  name?: string | null;\n}'

const fragmentPartialComplexQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
  ... on Human {
    name
    friends {
      id
    }
  }
}
`

const fragmentPartialComplexInterface0 = `export interface FragmentTest {\n  heroNoParam: IFragmentCharacterFields | null;\n}`;
const fragmentPartialComplexInterface1 = `export interface IFragmentCharacterFields {
  id: string;
  name?: string | null;
  friends?: Array<SelectionOnfriends | null> | null;
}`;

const fragmentPartialComplexAdditionalType = `export interface SelectionOnfriends {
  id: string;
}`;

const fragmentPartialComplexWithDirectiveQuery = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
    ... on Droid @skip(if: true) {
      name
    }
  }
}

fragment CharacterFields on Character {
  id
  ... on Human {
    name
    friends {
      id
    }
  }
}
`

const fragmentPartialComplexWithDirectiveInterface0 = `export interface FragmentTest {\n  heroNoParam: SelectionOnheroNoParam & IFragmentCharacterFields | null;\n}`;
const fragmentPartialComplexWithDirectiveInterface1 = `export interface IFragmentCharacterFields {
  id: string;
  name?: string | null;
  friends?: Array<SelectionOnfriends | null> | null;
}`;

const fragmentPartialComplexWithDirectiveAdditionalType0 = `export type SelectionOnheroNoParam = Partial<{
  name?: string | null;
}>`;

const fragmentPartialComplexWithDirectiveAdditionalType1 = `export interface SelectionOnfriends {
  id: string;
}`;

const dedupeQuery = `
query Test {
  hero1: heroNoParam {
    friends {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
        }
      }
    }
  }
  hero2: heroNoParam {
    friends {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
        }
      }
    }
  }
}
`

const dedupeResponse = {
  interface: `export interface Test {
  hero1: SelectionOnheroNoParam | null;
    hero2: SelectionOnheroNoParam | null;
}`,
  variables: '',
  additionalTypes: [`export interface SelectionOnfriends {
  id: string;
  name: string | null;
}`,
  `export interface SelectionOnfriends1 {
  id: string;
  name: string | null;
  friends: Array<SelectionOnfriends | null> | null;
}`,
  `export interface SelectionOnfriends2 {
  id: string;
  name: string | null;
  friends: Array<SelectionOnfriends1 | null> | null;
}`,
`export interface SelectionOnheroNoParam {
  friends: Array<SelectionOnfriends2 | null> | null;
}`]
}

describe('with subtypes', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery, undefined);
    expect(response[0].interface).to.equal(simpleQueryWithSubTypesResponse.interface);
    expect(response[0].variables).to.equal(simpleQueryWithSubTypesResponse.variables);
    expect(response[0].additionalTypes[0]).to.equal(simpleQueryWithSubTypesResponse.additionalTypes[0]);
    expect(response[0].additionalTypes.length).to.equal(1);
    expect(response.length).to.equal(1);
  });

  it ('does array query', () => {
    const response = runProgram(schema, arrTest, undefined);
    expect(response[0].interface).to.equal(arrQueryWithSubTypesResponse.interface);
    expect(response[0].variables).to.equal(arrQueryWithSubTypesResponse.variables);
    expect(response[0].additionalTypes[0]).to.equal(arrQueryWithSubTypesResponse.additionalTypes[0]);
    expect(response[0].additionalTypes[1]).to.equal(arrQueryWithSubTypesResponse.additionalTypes[1]);
    expect(response[0].additionalTypes[2]).to.equal(arrQueryWithSubTypesResponse.additionalTypes[2]);
    expect(response[0].additionalTypes[3]).to.equal(arrQueryWithSubTypesResponse.additionalTypes[3]);
    expect(response[0].additionalTypes.length).to.equal(4);
    expect(response.length).to.equal(1);
  });

  it ('does fragment query', () => {
    const response = runProgram(schema, fragmentQuery);
    expect(response[0].interface).to.equal(fragmentInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does partial fragment query', () => {
    const response = runProgram(schema, fragmentPartialQuery);
    expect(response[0].interface).to.equal(fragmentPartialInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentPartialInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does partial fragment query with complex types', () => {
    const response = runProgram(schema, fragmentPartialComplexQuery);
    expect(response[0].interface).to.equal(fragmentPartialComplexInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[0].additionalTypes.length).to.equal(0);
    expect(response[1].interface).to.equal(fragmentPartialComplexInterface1);
    expect(response[1].variables).to.equal('');
    expect(response[1].additionalTypes.length).to.equal(1);
    expect(response[1].additionalTypes[0]).to.equal(fragmentPartialComplexAdditionalType);
    expect(response.length).to.equal(2);
  })

  it ('does partial fragment query with complex types and directives', () => {
    const response = runProgram(schema, fragmentPartialComplexWithDirectiveQuery);
    expect(response[0].interface).to.equal(fragmentPartialComplexWithDirectiveInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[0].additionalTypes.length).to.equal(1);
    expect(response[0].additionalTypes[0]).to.equal(fragmentPartialComplexWithDirectiveAdditionalType0);
    expect(response[1].interface).to.equal(fragmentPartialComplexWithDirectiveInterface1);
    expect(response[1].variables).to.equal('');
    expect(response[1].additionalTypes.length).to.equal(1);
    expect(response[1].additionalTypes[0]).to.equal(fragmentPartialComplexWithDirectiveAdditionalType1);
    expect(response.length).to.equal(2);
  })

  it ('dedupes and enumerates', () => {
    const response = runProgram(schema, dedupeQuery, undefined);
    expect(response[0].interface).to.equal(dedupeResponse.interface);
    expect(response[0].variables).to.equal(dedupeResponse.variables);
    expect(response[0].additionalTypes[0]).to.equal(dedupeResponse.additionalTypes[0]);
    expect(response[0].additionalTypes[1]).to.equal(dedupeResponse.additionalTypes[1]);
    expect(response[0].additionalTypes[2]).to.equal(dedupeResponse.additionalTypes[2]);
    expect(response[0].additionalTypes[3]).to.equal(dedupeResponse.additionalTypes[3]);
    expect(response[0].additionalTypes.length).to.equal(4);
    expect(response.length).to.equal(1);
  })
})
