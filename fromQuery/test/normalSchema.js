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

describe('simple examples', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery)
    expect(response[0].interface).to.equal(simplestQueryResponse[0].interface);
    expect(response[0].variables).to.equal(simplestQueryResponse[0].variables);
  });

  it ('supports variables', () => {
    const response = runProgram(schema, variableQuery)
    expect(response[0].interface).to.equal(variableExpectedResponse[0].interface);
    expect(response[0].variables).to.equal(variableExpectedResponse[0].variables);
  });

  it ('supports arrays', () => {
    const response = runProgram(schema, arrTest);
    expect(response[0].interface).to.equal(arrInterface);
    expect(response[0].variables).to.equal('');
  });

  it ('supports enums', () => {
    const response = runProgram(schema, enumQuery);
    expect(response[0].interface).to.equal(enumResponse.interface);
    expect(response[0].variables).to.equal(enumResponse.variables);
  })
});
