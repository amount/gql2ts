module.exports = `
  enum Episode { NEWHOPE, EMPIRE, JEDI }

  interface Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    nullArrNonNullContents: [Character!]
  }

  type Human implements Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]
    homePlanet: String

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    nullArrNonNullContents: [Character!]
  }

  type Droid implements Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]
    primaryFunction: String

    primaryFunctionNonNull: String!

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    nullArrNonNullContents: [Character!]
  }

  scalar TestScalar

  type Query {
    heroNoParam: Character
    hero(episode: Episode): Character
    human(id: String!): Human
    droid(id: String!): Droid
    test(test: TestScalar): TestScalar
  }
`;
