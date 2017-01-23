module.exports = `// tslint:disable
// graphql typescript definitions

declare namespace GQL {
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
    allFilms: IFilmsConnection | null;
    film: IFilm | null;
    allPeople: IPeopleConnection | null;
    person: IPerson | null;
    allPlanets: IPlanetsConnection | null;
    planet: IPlanet | null;
    allSpecies: ISpeciesConnection | null;
    species: ISpecies | null;
    allStarships: IStarshipsConnection | null;
    starship: IStarship | null;
    allVehicles: IVehiclesConnection | null;
    vehicle: IVehicle | null;
    node: Node | null;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: Information about pagination in a connection.
  */
  interface IPageInfo {
    __typename: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A single film.
  */
  interface IFilm {
    __typename: string;
    title: string | null;
    episodeID: number | null;
    openingCrawl: string | null;
    director: string | null;
    producers: Array<string> | null;
    releaseDate: string | null;
    speciesConnection: IFilmSpeciesConnection | null;
    starshipConnection: IFilmStarshipsConnection | null;
    vehicleConnection: IFilmVehiclesConnection | null;
    characterConnection: IFilmCharactersConnection | null;
    planetConnection: IFilmPlanetsConnection | null;
    created: string | null;
    edited: string | null;
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
    name: string | null;
    diameter: number | null;
    rotationPeriod: number | null;
    orbitalPeriod: number | null;
    gravity: string | null;
    population: number | null;
    climates: Array<string> | null;
    terrains: Array<string> | null;
    surfaceWater: number | null;
    residentConnection: IPlanetResidentsConnection | null;
    filmConnection: IPlanetFilmsConnection | null;
    created: string | null;
    edited: string | null;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetResidentsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetResidentsEdge> | null;
    totalCount: number | null;
    residents: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetResidentsEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: An individual person or character within the Star Wars universe.
  */
  interface IPerson {
    __typename: string;
    name: string | null;
    birthYear: string | null;
    eyeColor: string | null;
    gender: string | null;
    hairColor: string | null;
    height: number | null;
    mass: number | null;
    skinColor: string | null;
    homeworld: IPlanet | null;
    filmConnection: IPersonFilmsConnection | null;
    species: ISpecies | null;
    starshipConnection: IPersonStarshipsConnection | null;
    vehicleConnection: IPersonVehiclesConnection | null;
    created: string | null;
    edited: string | null;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A type of person or character within the Star Wars Universe.
  */
  interface ISpecies {
    __typename: string;
    name: string | null;
    classification: string | null;
    designation: string | null;
    averageHeight: number | null;
    averageLifespan: number | null;
    eyeColors: Array<string> | null;
    hairColors: Array<string> | null;
    skinColors: Array<string> | null;
    language: string | null;
    homeworld: IPlanet | null;
    personConnection: ISpeciesPeopleConnection | null;
    filmConnection: ISpeciesFilmsConnection | null;
    created: string | null;
    edited: string | null;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesPeopleConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesPeopleEdge> | null;
    totalCount: number | null;
    people: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesPeopleEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonStarshipsEdge> | null;
    totalCount: number | null;
    starships: Array<IStarship> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonStarshipsEdge {
    __typename: string;
    node: IStarship | null;
    cursor: string;
  }

  /*
    description: A single transport craft that has hyperdrive capability.
  */
  interface IStarship {
    __typename: string;
    name: string | null;
    model: string | null;
    starshipClass: string | null;
    manufacturers: Array<string> | null;
    costInCredits: number | null;
    length: number | null;
    crew: string | null;
    passengers: string | null;
    maxAtmospheringSpeed: number | null;
    hyperdriveRating: number | null;
    MGLT: number | null;
    cargoCapacity: number | null;
    consumables: string | null;
    pilotConnection: IStarshipPilotsConnection | null;
    filmConnection: IStarshipFilmsConnection | null;
    created: string | null;
    edited: string | null;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipPilotsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipPilotsEdge> | null;
    totalCount: number | null;
    pilots: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipPilotsEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPersonVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPersonVehiclesEdge> | null;
    totalCount: number | null;
    vehicles: Array<IVehicle> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPersonVehiclesEdge {
    __typename: string;
    node: IVehicle | null;
    cursor: string;
  }

  /*
    description: A single transport craft that does not have hyperdrive capability
  */
  interface IVehicle {
    __typename: string;
    name: string | null;
    model: string | null;
    vehicleClass: string | null;
    manufacturers: Array<string> | null;
    costInCredits: number | null;
    length: number | null;
    crew: string | null;
    passengers: string | null;
    maxAtmospheringSpeed: number | null;
    cargoCapacity: number | null;
    consumables: string | null;
    pilotConnection: IVehiclePilotsConnection | null;
    filmConnection: IVehicleFilmsConnection | null;
    created: string | null;
    edited: string | null;
    id: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehiclePilotsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehiclePilotsEdge> | null;
    totalCount: number | null;
    pilots: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehiclePilotsEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehicleFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehicleFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehicleFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetFilmsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetFilmsEdge> | null;
    totalCount: number | null;
    films: Array<IFilm> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetFilmsEdge {
    __typename: string;
    node: IFilm | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmSpeciesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmSpeciesEdge> | null;
    totalCount: number | null;
    species: Array<ISpecies> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmSpeciesEdge {
    __typename: string;
    node: ISpecies | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmStarshipsEdge> | null;
    totalCount: number | null;
    starships: Array<IStarship> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmStarshipsEdge {
    __typename: string;
    node: IStarship | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmVehiclesEdge> | null;
    totalCount: number | null;
    vehicles: Array<IVehicle> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmVehiclesEdge {
    __typename: string;
    node: IVehicle | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmCharactersConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmCharactersEdge> | null;
    totalCount: number | null;
    characters: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmCharactersEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IFilmPlanetsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IFilmPlanetsEdge> | null;
    totalCount: number | null;
    planets: Array<IPlanet> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IFilmPlanetsEdge {
    __typename: string;
    node: IPlanet | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPeopleConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPeopleEdge> | null;
    totalCount: number | null;
    people: Array<IPerson> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPeopleEdge {
    __typename: string;
    node: IPerson | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IPlanetsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IPlanetsEdge> | null;
    totalCount: number | null;
    planets: Array<IPlanet> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IPlanetsEdge {
    __typename: string;
    node: IPlanet | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface ISpeciesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<ISpeciesEdge> | null;
    totalCount: number | null;
    species: Array<ISpecies> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface ISpeciesEdge {
    __typename: string;
    node: ISpecies | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IStarshipsConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IStarshipsEdge> | null;
    totalCount: number | null;
    starships: Array<IStarship> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IStarshipsEdge {
    __typename: string;
    node: IStarship | null;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  interface IVehiclesConnection {
    __typename: string;
    pageInfo: IPageInfo;
    edges: Array<IVehiclesEdge> | null;
    totalCount: number | null;
    vehicles: Array<IVehicle> | null;
  }

  /*
    description: An edge in a connection.
  */
  interface IVehiclesEdge {
    __typename: string;
    node: IVehicle | null;
    cursor: string;
  }
}

// tslint:enable
`
