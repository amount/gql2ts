const runProgram = require('../index.js').default;
const schema = require('./shared/mutationSchema');
const expect = require('chai').expect;

const mutationNoArguments = `
  mutation CreateMessage {
    createMessage(input: {
      author: "andy",
      content: "hope is a good thing",
    }) {
      id
    }
  }
`;

const mutationReturnExpected = `export interface CreateMessage {
  createMessage: {
    id: string;
  } | null;
}`

const mutationMultipleArguments = `
  mutation CreateMessage ($author: String, $content: String) {
    createMessage(input: {
      author: $author,
      content: $content,
    }) {
      id
    }
  }
`;

const mutationMultipleArgumentsVariables = `export interface CreateMessageInput {
  author?: string | null;
  content?: string | null;
}`;

const mutationInputArgument = `
  mutation CreateMessage($input: MessageInput) {
    createMessage(input: $input) {
      id
    }
  }
`;

const mutationInputArgumentVariables = `export interface CreateMessageInput {
  input?: {
    content?: string | null;
    author?: string | null;
  } | null;
}`;

const mutationInputArgumentNonNull = `
  mutation CreateMessage($input: MessageInput!) {
    createMessage(input: $input) {
      id
    }
  }
`;

const mutationInputArgumentNonNullVariables = `export interface CreateMessageInput {
  input: {
    content?: string | null;
    author?: string | null;
  };
}`;

describe('Mutations', () => {
  it ('works with no arguments', () => {
    const response = runProgram(schema, mutationNoArguments);
    expect(response[0].interface).to.equal(mutationReturnExpected);
    expect(response[0].variables).to.equal('');
    expect(response.length).to.equal(1);
  })

  it ('works with multiple arguments', () => {
    const response = runProgram(schema, mutationMultipleArguments);
    expect(response[0].interface).to.equal(mutationReturnExpected);
    expect(response[0].variables).to.equal(mutationMultipleArgumentsVariables);
    expect(response.length).to.equal(1);
  })

  it ('works with one input argument', () => {
    const response = runProgram(schema, mutationInputArgument);
    expect(response[0].interface).to.equal(mutationReturnExpected);
    expect(response[0].variables).to.equal(mutationInputArgumentVariables);
    expect(response.length).to.equal(1);
  })

  it ('works with one input argument (non-null)', () => {
    const response = runProgram(schema, mutationInputArgumentNonNull);
    expect(response[0].interface).to.equal(mutationReturnExpected);
    expect(response[0].variables).to.equal(mutationInputArgumentNonNullVariables);
    expect(response.length).to.equal(1);
  })

})
