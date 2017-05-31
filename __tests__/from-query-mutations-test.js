const runProgram = require('../packages/from-query').default;
const schema = require('./shared/mutationSchema');

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

const mutationInputArgument = `
  mutation CreateMessage($input: MessageInput) {
    createMessage(input: $input) {
      id
    }
  }
`;

const mutationInputArgumentNonNull = `
  mutation CreateMessage($input: MessageInput!) {
    createMessage(input: $input) {
      id
    }
  }
`;

const generateSubTypeInterfaceName = () => null;

describe('Mutations', () => {
  it ('works with no arguments', () => {
    const response = runProgram(schema, mutationNoArguments, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('works with multiple arguments', () => {
    const response = runProgram(schema, mutationMultipleArguments, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('works with one input argument', () => {
    const response = runProgram(schema, mutationInputArgument, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('works with one input argument (non-null)', () => {
    const response = runProgram(schema, mutationInputArgumentNonNull, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

})
