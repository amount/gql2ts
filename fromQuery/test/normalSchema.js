const runProgram = require('../index.js').default;
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

describe('simple examples', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery)
    expect(response[0].interface).to.equal(simplestQueryResponse[0].interface);
    expect(response[0].variables).to.equal(simplestQueryResponse[0].variables);
    expect(response.length).to.equal(1);
  });

  it ('supports variables', () => {
    const response = runProgram(schema, variableQuery)
    expect(response[0].interface).to.equal(variableExpectedResponse[0].interface);
    expect(response[0].variables).to.equal(variableExpectedResponse[0].variables);
    expect(response.length).to.equal(1);
  });

  it ('supports arrays', () => {
    const response = runProgram(schema, arrTest);
    expect(response[0].interface).to.equal(arrInterface);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  });

  it ('supports enums', () => {
    const response = runProgram(schema, enumQuery);
    expect(response[0].interface).to.equal(enumResponse.interface);
    expect(response[0].variables).to.equal(enumResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports custom scalars', () => {
    const response = runProgram(schema, customScalarQuery, { TestScalar: 'string' });
    expect(response[0].interface).to.equal(expectedCustomScalarResponse.interface);
    expect(response[0].variables).to.equal(expectedCustomScalarResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports unions', () => {
    const response = runProgram(schema, UnionQuery);
    expect(response[0].interface).to.equal(expectedUnionResponse.interface);
    expect(response[0].variables).to.equal(expectedUnionResponse.variables);
    expect(response.length).to.equal(1);
  })

  it ('supports unions with inline fragment', () => {
    const response = runProgram(schema, UnionQueryWithFragment);
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
    const response = runProgram(schema, fragmentQuery);
    expect(response[0].interface).to.equal(fragmentInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with other selections', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionQuery);
    expect(response[0].interface).to.equal(fragmentWithOtherSelectionInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithOtherSelectionInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with aliases', () => {
    const response = runProgram(schema, fragmentWithAliasQuery);
    expect(response[0].interface).to.equal(fragmentWithAliasInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithAliasInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does simple fragments with other selections and aliases', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionAndAliasQuery);
    expect(response[0].interface).to.equal(fragmentWithOtherSelectionAndAliasInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentWithOtherSelectionAndAliasInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does inline fragments on type', () => {
    const response = runProgram(schema, inlineFragmentQuery)
    expect(response[0].interface).to.equal(inlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does inline fragments on type with aliases', () => {
    const response = runProgram(schema, inlineFragmentWithAliasQuery)
    expect(response[0].interface).to.equal(inlineFragmentWithAliasExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does anonymous inline fragments', () => {
    const response = runProgram(schema, anonInlineFragmentQuery)
    expect(response[0].interface).to.equal(anonInlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does anonymous inline fragments with aliases', () => {
    const response = runProgram(schema, anonInlineFragmentWithAliasQuery)
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
  describe('on fields', () => {
    it ('works with simple fields', () => {
      const response = runProgram(schema, simplestQueryWithDirectives);
      expect(response[0].interface).to.equal(simplestQueryWithDirectivesExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    });
  });

  describe('fragments', () => {
    it ('works with fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectivesQuery);
      expect(response[0].interface).to.equal(fragmentWithDirectivesInterface0);
      expect(response[0].variables).to.equal('');
      expect(response[1].interface).to.equal(fragmentWithDirectivesInterface1);
      expect(response[1].variables).to.equal('');
      expect(response.length).to.equal(2);
    })

    it ('works with aliases on fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectiveWithAliasQuery);
      expect(response[0].interface).to.equal(fragmentWithDirectiveWithAliasInterface0);
      expect(response[0].variables).to.equal('');
      expect(response[1].interface).to.equal(fragmentWithDirectiveWithAliasInterface1);
      expect(response[1].variables).to.equal('');
      expect(response.length).to.equal(2);
    })

    it ('works with inline fragments on type', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveQuery)
      expect(response[0].interface).to.equal(inlineFragmentWithDirectiveExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('works with inline fragments on type with aliases', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveWithAliasQuery)
      expect(response[0].interface).to.equal(inlineFragmentWithDirectiveWithAliasExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('does anonymous inline fragments', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveQuery)
      expect(response[0].interface).to.equal(anonInlineFragmentWithDirectiveExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })

    it ('does anonymous inline fragments with aliases', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveWithAliasQuery)
      expect(response[0].interface).to.equal(anonInlineFragmentWithDirectiveWithAliasExpected);
      expect(response[0].variables).to.equal('');
      expect(response.length).to.equal(1);
    })
  })
})
