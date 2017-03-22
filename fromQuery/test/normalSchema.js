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
    arrNonNullContents {
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
    arrNonNullContents: Array<{
      id: string;
      name: string | null;
    }>;
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

const fragmentInterface0 = `export interface FragmentTest {\n  heroNoParam: {} & IFragmentCharacterFields | null;\n}`;
const fragmentInterface1 = 'export interface IFragmentCharacterFields {\n  id: string;\n}'

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


describe('fragments', () => {
  it ('does simple fragments', () => {
    const response = runProgram(schema, fragmentQuery)
    expect(response[0].interface).to.equal(fragmentInterface0);
    expect(response[0].variables).to.equal('');
    expect(response[1].interface).to.equal(fragmentInterface1);
    expect(response[1].variables).to.equal('');
    expect(response.length).to.equal(2);
  })

  it ('does inline fragments on type', () => {
    const response = runProgram(schema, inlineFragmentQuery)
    expect(response[0].interface).to.equal(inlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('does anonymous inline fragments', () => {
    const response = runProgram(schema, anonInlineFragmentQuery)
    expect(response[0].interface).to.equal(anonInlineFragmentExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })
})
