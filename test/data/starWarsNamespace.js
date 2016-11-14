module.exports = `// graphql typescript definitions

declare namespace StarWars {
  interface IGraphQLResponseRoot {
    data?: IRoot;
    errors?: Array<IGraphQLResponseError>;
  }

  interface IGraphQLResponseError {
    message: string;            // Required for all errors
    locations?: Array<IGraphQLResponseErrorLocation>;
    [propName: string]: any;    // 7.2.2 says 'GraphQL servers may provide additional entries to error'
  }

  interface IGraphQLResponseErrorLocation {
    line: number;
    column: number;
  }

  /*
    description: null
  */
  interface IRoot {
    __typename: string;
    allFilms: IFilmsConnection;
    film: IFilm;
    allPeople: IPeopleConnection;
    person: IPerson;
    allPlanets: IPlanetsConnection;
    planet: IPlanet;
    allSpecies: ISpeciesConnection;
    species: ISpecies;
    allStarships: IStarshipsConnection;
    starship: IStarship;
    allVehicles: IVehiclesConnection;
    vehicle: IVehicle;
    node: Node;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: Information about pagination in a connection.
  */
  interface IPageInfo {
    __typename: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A single film.
  */
  interface IFilm {
    __typename: string;
    title: string;
    episodeID: number;
    openingCrawl: string;
    director: string;
    producers: Array<string>;
    releaseDate: string;
    speciesConnection: IFilmSpeciesConnection;
    starshipConnection: IFilmStarshipsConnection;
    vehicleConnection: IFilmVehiclesConnection;
    characterConnection: IFilmCharactersConnection;
    planetConnection: IFilmPlanetsConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: An object with an ID
  */
  type Node = IPlanet | ISpecies | IStarship | IVehicle | IPerson | IFilm;

  /*
    description: An object with an ID
  */
  interface INode {
    __typename: string;
    id: string;
  }

  /*
    description: A large mass, planet or planetoid in the Star Wars Universe, at the time of
0 ABY.
  */
  interface IPlanet {
    __typename: string;
    name: string;
    diameter: number;
    rotationPeriod: number;
    orbitalPeriod: number;
    gravity: string;
    population: number;
    climates: Array<string>;
    terrains: Array<string>;
    surfaceWater: number;
    residentConnection: IPlanetResidentsConnection;
    filmConnection: IPlanetFilmsConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetResidentsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetResidentsEdge>;
    totalCount: number;
    residents: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetResidentsEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: An individual person or character within the Star Wars universe.
  */
  interface IPerson {
    __typename: string;
    name: string;
    birthYear: string;
    eyeColor: string;
    gender: string;
    hairColor: string;
    height: number;
    mass: number;
    skinColor: string;
    homeworld: IPlanet;
    filmConnection: IPersonFilmsConnection;
    species: ISpecies;
    starshipConnection: IPersonStarshipsConnection;
    vehicleConnection: IPersonVehiclesConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A type of person or character within the Star Wars Universe.
  */
  interface ISpecies {
    __typename: string;
    name: string;
    classification: string;
    designation: string;
    averageHeight: number;
    averageLifespan: number;
    eyeColors: Array<string>;
    hairColors: Array<string>;
    skinColors: Array<string>;
    language: string;
    homeworld: IPlanet;
    personConnection: ISpeciesPeopleConnection;
    filmConnection: ISpeciesFilmsConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesPeopleConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesPeopleEdge>;
    totalCount: number;
    people: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesPeopleEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonStarshipsEdge>;
    totalCount: number;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonStarshipsEdge {
    __typename: string;
    node: IStarship;
    cursor: string;
  }

  /*
    description: A single transport craft that has hyperdrive capability.
  */
  interface IStarship {
    __typename: string;
    name: string;
    model: string;
    starshipClass: string;
    manufacturers: Array<string>;
    costInCredits: number;
    length: number;
    crew: string;
    passengers: string;
    maxAtmospheringSpeed: number;
    hyperdriveRating: number;
    MGLT: number;
    cargoCapacity: number;
    consumables: string;
    pilotConnection: IStarshipPilotsConnection;
    filmConnection: IStarshipFilmsConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipPilotsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipPilotsEdge>;
    totalCount: number;
    pilots: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipPilotsEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonVehiclesEdge>;
    totalCount: number;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonVehiclesEdge {
    __typename: string;
    node: IVehicle;
    cursor: string;
  }

  /*
    description: A single transport craft that does not have hyperdrive capability
  */
  interface IVehicle {
    __typename: string;
    name: string;
    model: string;
    vehicleClass: string;
    manufacturers: Array<string>;
    costInCredits: number;
    length: number;
    crew: string;
    passengers: string;
    maxAtmospheringSpeed: number;
    cargoCapacity: number;
    consumables: string;
    pilotConnection: IVehiclePilotsConnection;
    filmConnection: IVehicleFilmsConnection;
    created: string;
    edited: string;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehiclePilotsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehiclePilotsEdge>;
    totalCount: number;
    pilots: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehiclePilotsEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehicleFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehicleFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehicleFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetFilmsEdge>;
    totalCount: number;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetFilmsEdge {
    __typename: string;
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmSpeciesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmSpeciesEdge>;
    totalCount: number;
    species: Array<ISpecies>;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmSpeciesEdge {
    __typename: string;
    node: ISpecies;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmStarshipsEdge>;
    totalCount: number;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmStarshipsEdge {
    __typename: string;
    node: IStarship;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmVehiclesEdge>;
    totalCount: number;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmVehiclesEdge {
    __typename: string;
    node: IVehicle;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmCharactersConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmCharactersEdge>;
    totalCount: number;
    characters: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmCharactersEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmPlanetsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmPlanetsEdge>;
    totalCount: number;
    planets: Array<IPlanet>;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmPlanetsEdge {
    __typename: string;
    node: IPlanet;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPeopleConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPeopleEdge>;
    totalCount: number;
    people: Array<IPerson>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPeopleEdge {
    __typename: string;
    node: IPerson;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetsEdge>;
    totalCount: number;
    planets: Array<IPlanet>;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetsEdge {
    __typename: string;
    node: IPlanet;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesEdge>;
    totalCount: number;
    species: Array<ISpecies>;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesEdge {
    __typename: string;
    node: ISpecies;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipsEdge>;
    totalCount: number;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipsEdge {
    __typename: string;
    node: IStarship;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehiclesEdge>;
    totalCount: number;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehiclesEdge {
    __typename: string;
    node: IVehicle;
    cursor: string;
  }
}
`
