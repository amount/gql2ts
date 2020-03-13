import runProgram from '../packages/from-query/src';
import schema from './shared/simpleSchema';

const simplestQuery: string = `
  query TestQuery {
    heroNoParam {
      id
      name
    }
  }
`;
const simpleQueryWithTypename: string = `
  query TestQuery {
    heroNoParam {
      __typename
      id
      name
    }
  }
`;

const variableQuery: string = `
  query TestQuery ($id: String!) {
    human (id: $id) {
      id
      name
    }
  }
`;
const variableArrayQuery: string = `
  query TestQuery ($ids: [ID!]!) {
    getCharacters (ids: $ids) {
      id
      name
    }
  }
`;

const arrTest: string = `
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
`;
const enumQuery: string = `
query EnumQuery($episode: Episode) {
  hero(episode: $episode) {
    appearsIn
  }
}`;

const customScalarQuery: string = `
query CustomScalarQuery($test: TestScalar) {
  test (test: $test)
}
`;

const UnionQuery: string = `
query UnionQuery($id: String!) {
  humanOrDroid (id: $id) {
    id
  }
}
`;

const UnionQueryWithFragment: string = `
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

const anonQuery: string = `
  query {
    heroNoParam {
      id
      name
    }
  }
`;

const nakedQuery: string = `
  query {
    heroNoParam {
      id
      name
    }
  }
`;

const generateSubTypeInterfaceName: () => null = () => null;

describe('simple examples', () => {
  it('does a very simple query', () => {
    const response: string = runProgram(
      schema,
      simplestQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });
  it('does a very simple query with typename', () => {
    const response: string = runProgram(
      schema,
      simpleQueryWithTypename,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });
  it('does unnamed queries', () => {
    const response: string = runProgram(
      schema,
      anonQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does "naked" queries', () => {
    const response: string = runProgram(
      schema,
      nakedQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports variables', () => {
    const response: string = runProgram(
      schema,
      variableQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports list variables', () => {
    const response: string = runProgram(
      schema,
      variableArrayQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports arrays', () => {
    const response: string = runProgram(
      schema,
      arrTest,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports enums', () => {
    const response: string = runProgram(
      schema,
      enumQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports custom scalars', () => {
    const response: string = runProgram(
      schema,
      customScalarQuery,
      { TestScalar: 'string' },
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports unions', () => {
    const response: string = runProgram(
      schema,
      UnionQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('supports unions with inline fragment', () => {
    const response: string = runProgram(
      schema,
      UnionQueryWithFragment,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });
});

const fragmentQuery: string = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
}
`;

const nestedFragmentQuery: string = `
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

const nestedFragment2Query: string = `
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

const nestedFragment3Query: string = `
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

const fragmentWithOtherSelectionQuery: string = `
query FragmentTest {
  heroNoParam {
    name
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  id
}
`;

const fragmentWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  b: id
}
`;

const fragmentWithOtherSelectionAndAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    b: name
    ...CharacterFields
  }
}

fragment CharacterFields on Character {
  c: id
}
`;

const inlineFragmentQuery: string = `
query FragmentTest {
  heroNoParam {
    ... on Droid {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ... on Droid {
    	b: primaryFunction
      c: primaryFunctionNonNull
    }
  }
}`;

const anonInlineFragmentQuery: string = `
query FragmentTest {
  heroNoParam {
    ... {
    	id
      name
    }
  }
}`;

const anonInlineFragmentWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ... {
    	b: id
      c: name
    }
  }
}`;

describe('fragments', () => {
  it('does simple fragments', () => {
    const response: string = runProgram(
      schema,
      fragmentQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does simple fragments with other selections', () => {
    const response: string = runProgram(
      schema,
      fragmentWithOtherSelectionQuery,
      undefined,
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });

  it('does simple fragments with aliases', () => {
    const response: string = runProgram(
      schema,
      fragmentWithAliasQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does simple fragments with other selections and aliases', () => {
    const response: string = runProgram(
      schema,
      fragmentWithOtherSelectionAndAliasQuery,
      undefined,
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });

  it('does nested fragments', () => {
    const response: string = runProgram(
      schema,
      nestedFragmentQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does nested fragments 2', () => {
    const response: string = runProgram(
      schema,
      nestedFragment2Query,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does nested fragments 3', () => {
    const response: string = runProgram(
      schema,
      nestedFragment3Query,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does inline fragments on type', () => {
    const response: string = runProgram(
      schema,
      inlineFragmentQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does inline fragments on type with aliases', () => {
    const response: string = runProgram(
      schema,
      inlineFragmentWithAliasQuery,
      undefined,
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });

  it('does anonymous inline fragments', () => {
    const response: string = runProgram(
      schema,
      anonInlineFragmentQuery,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });

  it('does anonymous inline fragments with aliases', () => {
    const response: string = runProgram(
      schema,
      anonInlineFragmentWithAliasQuery,
      undefined,
      { generateSubTypeInterfaceName }
    );
    expect(response).toMatchSnapshot();
  });
});

const simplestQueryWithDirectives: string = `
  query TestQuery {
    heroNoParam {
      id @include(if: true)
      name @skip(if: true)
    }
  }
`;

const simpleQueryBadDirectives: string = `
  query TestQuery {
    heroNoParam {
      id @nope(if: true)
      name @yep(if: true)
    }
  }
`;

const fragmentWithDirectivesQuery: string = `
query FragmentTest {
  heroNoParam {
    ...CharacterFields @skip(if: true)
  }
}

fragment CharacterFields on Character {
  id
}
`;

const fragmentWithDirectiveWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ...CharacterFields @include(if: true)
  }
}

fragment CharacterFields on Character {
  b: id
}
`;

const inlineFragmentWithDirectiveQuery: string = `
query FragmentTest {
  heroNoParam {
    ... on Droid @include(if: true) {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithDirectiveOnBaseQuery: string = `
query FragmentTest {
  heroNoParam @include(if: true) {
    ... on Droid {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
}`;

const inlineFragmentWithDirectiveWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ... on Droid @include(if: true) {
    	b: primaryFunction
      c: primaryFunctionNonNull
    }
  }
}`;

const anonInlineFragmentWithDirectiveQuery: string = `
query FragmentTest {
  heroNoParam {
    ... @include(if: true) {
    	id
      name
    }
  }
}`;

const anonInlineFragmentWithDirectiveWithAliasQuery: string = `
query FragmentTest {
  a: heroNoParam {
    ... @include(if: true) {
    	b: id
      c: name
    }
  }
}`;

describe('directives', () => {
  it('outputs bad directives', () => {
    const response: string = runProgram(
      schema,
      simpleQueryBadDirectives,
      undefined,
      {
        generateSubTypeInterfaceName
      }
    );
    expect(response).toMatchSnapshot();
  });
  describe('on fields', () => {
    it('works with simple fields', () => {
      const response: string = runProgram(
        schema,
        simplestQueryWithDirectives,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });
  });

  describe('fragments', () => {
    it('works with fragment spread', () => {
      const response: string = runProgram(
        schema,
        fragmentWithDirectivesQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('works with aliases on fragment spread', () => {
      const response: string = runProgram(
        schema,
        fragmentWithDirectiveWithAliasQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('works with inline fragments on type', () => {
      const response: string = runProgram(
        schema,
        inlineFragmentWithDirectiveQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('works with inline fragments on base', () => {
      const response: string = runProgram(
        schema,
        inlineFragmentWithDirectiveOnBaseQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('works with inline fragments on type with aliases', () => {
      const response: string = runProgram(
        schema,
        inlineFragmentWithDirectiveWithAliasQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('does anonymous inline fragments', () => {
      const response: string = runProgram(
        schema,
        anonInlineFragmentWithDirectiveQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });

    it('does anonymous inline fragments with aliases', () => {
      const response: string = runProgram(
        schema,
        anonInlineFragmentWithDirectiveWithAliasQuery,
        undefined,
        { generateSubTypeInterfaceName }
      );
      expect(response).toMatchSnapshot();
    });
  });
});

const fragmentPartialQuery: string = `
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
`;

const fragmentPartialComplexQuery: string = `
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
`;

const fragmentPartialComplexWithDirectiveQuery: string = `
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
`;

const dedupeQuery: string = `
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
`;

describe('with subtypes', () => {
  it('does a very simple query', () => {
    const response: string = runProgram(
      schema,
      simplestQuery,
      undefined
    );
    expect(response).toMatchSnapshot();
  });

  it('does array query', () => {
    const response: string = runProgram(
      schema,
      arrTest,
      undefined
    );
    expect(response).toMatchSnapshot();
  });

  it('does fragment query', () => {
    const response: string = runProgram(schema, fragmentQuery);
    expect(response).toMatchSnapshot();
  });

  it('does partial fragment query', () => {
    const response: string = runProgram(
      schema,
      fragmentPartialQuery
    );
    expect(response).toMatchSnapshot();
  });

  it('does partial fragment query with complex types', () => {
    const response: string = runProgram(
      schema,
      fragmentPartialComplexQuery
    );
    expect(response).toMatchSnapshot();
  });

  it('does partial fragment query with complex types and directives', () => {
    const response: string = runProgram(
      schema,
      fragmentPartialComplexWithDirectiveQuery
    );
    expect(response).toMatchSnapshot();
  });

  it('dedupes and enumerates', () => {
    const response: string = runProgram(
      schema,
      dedupeQuery,
      undefined
    );
    expect(response).toMatchSnapshot();
  });
});
