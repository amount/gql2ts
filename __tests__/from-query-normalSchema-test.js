const runProgram = require('../packages/from-query').default;
const schema = require('./shared/simpleSchema');

const simplestQuery = `
  query TestQuery {
    heroNoParam {
      id
      name
    }
  }
`;
const simpleQueryWithTypename = `
  query TestQuery {
    heroNoParam {
      __typename
      id
      name
    }
  }
`;

const variableQuery = `
  query TestQuery ($id: String!) {
    human (id: $id) {
      id
      name
    }
  }
`;
const variableArrayQuery = `
  query TestQuery ($ids: [ID!]!) {
    getCharacters (ids: $ids) {
      id
      name
    }
  }
`;

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
const enumQuery = `
query EnumQuery($episode: Episode) {
  hero(episode: $episode) {
    appearsIn
  }
}`

const customScalarQuery = `
query CustomScalarQuery($test: TestScalar) {
  test (test: $test)
}
`;

const UnionQuery = `
query UnionQuery($id: String!) {
  humanOrDroid (id: $id) {
    id
  }
}
`;

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

const generateSubTypeInterfaceName = () => null;
describe('simple examples', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });
  it ('does a very simple query', () => {
    const response = runProgram(schema, simpleQueryWithTypename, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });
  it ('does unnamed queries', () => {
    const response = runProgram(schema, anonQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });

  it ('does "naked" queries', () => {
    const response = runProgram(schema, nakedQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });

  it ('supports variables', () => {
    const response = runProgram(schema, variableQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });

  it ('supports list variables', () => {
    const response = runProgram(schema, variableArrayQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });

  it ('supports arrays', () => {
    const response = runProgram(schema, arrTest, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  });

  it ('supports enums', () => {
    const response = runProgram(schema, enumQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('supports custom scalars', () => {
    const response = runProgram(schema, customScalarQuery, { TestScalar: 'string' }, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('supports unions', () => {
    const response = runProgram(schema, UnionQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('supports unions with inline fragment', () => {
    const response = runProgram(schema, UnionQueryWithFragment, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
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

const inlineFragmentQuery = `
query FragmentTest {
  heroNoParam {
    ... on Droid {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
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

const anonInlineFragmentQuery = `
query FragmentTest {
  heroNoParam {
    ... {
    	id
      name
    }
  }
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

describe('fragments', () => {
  it ('does simple fragments', () => {
    const response = runProgram(schema, fragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does simple fragments with other selections', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does simple fragments with aliases', () => {
    const response = runProgram(schema, fragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does simple fragments with other selections and aliases', () => {
    const response = runProgram(schema, fragmentWithOtherSelectionAndAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does nested fragments', () => {
    const response = runProgram(schema, nestedFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does nested fragments 2', () => {
    const response = runProgram(schema, nestedFragment2Query, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does nested fragments 3', () => {
    const response = runProgram(schema, nestedFragment3Query, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does inline fragments on type', () => {
    const response = runProgram(schema, inlineFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does inline fragments on type with aliases', () => {
    const response = runProgram(schema, inlineFragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does anonymous inline fragments', () => {
    const response = runProgram(schema, anonInlineFragmentQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })

  it ('does anonymous inline fragments with aliases', () => {
    const response = runProgram(schema, anonInlineFragmentWithAliasQuery, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
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

const simpleQueryBadDirectives = `
  query TestQuery {
    heroNoParam {
      id @nope(if: true)
      name @yep(if: true)
    }
  }
`;

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

const inlineFragmentWithDirectiveQuery = `
query FragmentTest {
  heroNoParam {
    ... on Droid @include(if: true) {
    	primaryFunction
      primaryFunctionNonNull
    }
  }
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

const anonInlineFragmentWithDirectiveQuery = `
query FragmentTest {
  heroNoParam {
    ... @include(if: true) {
    	id
      name
    }
  }
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

describe('directives', () => {
  it ('outputs bad directives', () => {
    const response = runProgram(schema, simpleQueryBadDirectives, undefined, { generateSubTypeInterfaceName });
    expect(response).toMatchSnapshot();
  })
  describe('on fields', () => {
    it ('works with simple fields', () => {
      const response = runProgram(schema, simplestQueryWithDirectives, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    });
  });

  describe('fragments', () => {
    it ('works with fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectivesQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })

    it ('works with aliases on fragment spread', () => {
      const response = runProgram(schema, fragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })

    it ('works with inline fragments on type', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })

    it ('works with inline fragments on type with aliases', () => {
      const response = runProgram(schema, inlineFragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })

    it ('does anonymous inline fragments', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })

    it ('does anonymous inline fragments with aliases', () => {
      const response = runProgram(schema, anonInlineFragmentWithDirectiveWithAliasQuery, undefined, { generateSubTypeInterfaceName });
      expect(response).toMatchSnapshot();
    })
  })
})

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

describe('with subtypes', () => {
  it ('does a very simple query', () => {
    const response = runProgram(schema, simplestQuery, undefined);
    expect(response).toMatchSnapshot();
  });

  it ('does array query', () => {
    const response = runProgram(schema, arrTest, undefined);
    expect(response).toMatchSnapshot();
  });

  it ('does fragment query', () => {
    const response = runProgram(schema, fragmentQuery);
    expect(response).toMatchSnapshot();
  })

  it ('does partial fragment query', () => {
    const response = runProgram(schema, fragmentPartialQuery);
    expect(response).toMatchSnapshot();
  })

  it ('does partial fragment query with complex types', () => {
    const response = runProgram(schema, fragmentPartialComplexQuery);
    expect(response).toMatchSnapshot();
  })

  it ('does partial fragment query with complex types and directives', () => {
    const response = runProgram(schema, fragmentPartialComplexWithDirectiveQuery);
    expect(response).toMatchSnapshot();
  })

  it ('dedupes and enumerates', () => {
    const response = runProgram(schema, dedupeQuery, undefined);
    expect(response).toMatchSnapshot();
  })
})
