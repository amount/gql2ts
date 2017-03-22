module.exports = `
  enum Episode { NEWHOPE, EMPIRE, JEDI }

  interface Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    arrNonNullContents: [Character!]!
  }

  type Human implements Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]
    homePlanet: String

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    arrNonNullContents: [Character!]!
  }

  type Droid implements Character {
    id: String!
    name: String
    friends: [Character]
    appearsIn: [Episode]
    primaryFunction: String

    nonNullArr: [Character]!
    nonNullArrAndContents: [Character!]!
    arrNonNullContents: [Character!]!
  }

  type Query {
    heroNoParam: Character
    hero(episode: Episode): Character
    human(id: String!): Human
    droid(id: String!): Droid
  }
`
