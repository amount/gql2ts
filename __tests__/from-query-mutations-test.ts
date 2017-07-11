import runProgram from '../packages/from-query/src';
import { IFromQueryReturnValue } from '../packages/types/src';
import schema from './shared/mutationSchema';

const mutationNoArguments: string = `
  mutation CreateMessage {
    createMessage(input: {
      author: "andy",
      content: "hope is a good thing",
    }) {
      id
    }
  }
`;

const mutationMultipleArguments: string = `
  mutation CreateMessage ($author: String, $content: String) {
    createMessage(input: {
      author: $author,
      content: $content,
    }) {
      id
    }
  }
`;

const mutationInputArgument: string = `
  mutation CreateMessage($input: MessageInput) {
    createMessage(input: $input) {
      id
    }
  }
`;

const mutationInputArgumentNonNull: string = `
  mutation CreateMessage($input: MessageInput!) {
    createMessage(input: $input) {
      id
    }
  }
`;

const generateSubTypeInterfaceName: () => null = () => null;

describe('Mutations', () => {
  it('works with no arguments', () => {
    const response: IFromQueryReturnValue[] = runProgram(schema, mutationNoArguments, undefined, {
      generateSubTypeInterfaceName
    });
    expect(response).toMatchSnapshot();
  });

  it('works with multiple arguments', () => {
    const response: IFromQueryReturnValue[] = runProgram(schema, mutationMultipleArguments, undefined, {
      generateSubTypeInterfaceName
    });
    expect(response).toMatchSnapshot();
  });

  it('works with one input argument', () => {
    const response: IFromQueryReturnValue[] = runProgram(schema, mutationInputArgument, undefined, {
      generateSubTypeInterfaceName
    });
    expect(response).toMatchSnapshot();
  });

  it('works with one input argument (non-null)', () => {
    const response: IFromQueryReturnValue[] = runProgram(
      schema,
      mutationInputArgumentNonNull,
      undefined,
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });
});
