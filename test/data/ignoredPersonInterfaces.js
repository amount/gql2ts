module.exports = `  /*
    description: null
  */
  export interface IRoot {
    allFilms: IFilmsConnection;
    film: IFilm;
    allPeople: IPeopleConnection;
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
  export interface IFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: Information about pagination in a connection.
  */
  export interface IPageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A single film.
  */
  export interface IFilm {
    title: string;
    episodeID: any;
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
  export type Node = IPlanet | ISpecies | IStarship | IVehicle | IFilm;

  /*
    description: An object with an ID
  */
  export interface INode extends IPlanet, ISpecies, IStarship, IVehicle, IFilm {
    id: string;
  }

  /*
    description: A large mass, planet or planetoid in the Star Wars Universe, at the time of
0 ABY.
  */
  export interface IPlanet {
    name: string;
    diameter: any;
    rotationPeriod: any;
    orbitalPeriod: any;
    gravity: string;
    population: any;
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
  export interface IPlanetResidentsConnection {
    pageInfo: IPageInfo;
    edges: Array<IPlanetResidentsEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPlanetResidentsEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPersonFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<IPersonFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPersonFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A type of person or character within the Star Wars Universe.
  */
  export interface ISpecies {
    name: string;
    classification: string;
    designation: string;
    averageHeight: number;
    averageLifespan: any;
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
  export interface ISpeciesPeopleConnection {
    pageInfo: IPageInfo;
    edges: Array<ISpeciesPeopleEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface ISpeciesPeopleEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface ISpeciesFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<ISpeciesFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  export interface ISpeciesFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPersonStarshipsConnection {
    pageInfo: IPageInfo;
    edges: Array<IPersonStarshipsEdge>;
    totalCount: any;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPersonStarshipsEdge {
    node: IStarship;
    cursor: string;
  }

  /*
    description: A single transport craft that has hyperdrive capability.
  */
  export interface IStarship {
    name: string;
    model: string;
    starshipClass: string;
    manufacturers: Array<string>;
    costInCredits: number;
    length: number;
    crew: string;
    passengers: string;
    maxAtmospheringSpeed: any;
    hyperdriveRating: number;
    MGLT: any;
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
  export interface IStarshipPilotsConnection {
    pageInfo: IPageInfo;
    edges: Array<IStarshipPilotsEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface IStarshipPilotsEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IStarshipFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<IStarshipFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IStarshipFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPersonVehiclesConnection {
    pageInfo: IPageInfo;
    edges: Array<IPersonVehiclesEdge>;
    totalCount: any;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPersonVehiclesEdge {
    node: IVehicle;
    cursor: string;
  }

  /*
    description: A single transport craft that does not have hyperdrive capability
  */
  export interface IVehicle {
    name: string;
    model: string;
    vehicleClass: string;
    manufacturers: Array<string>;
    costInCredits: any;
    length: number;
    crew: string;
    passengers: string;
    maxAtmospheringSpeed: any;
    cargoCapacity: any;
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
  export interface IVehiclePilotsConnection {
    pageInfo: IPageInfo;
    edges: Array<IVehiclePilotsEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface IVehiclePilotsEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IVehicleFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<IVehicleFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IVehicleFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPlanetFilmsConnection {
    pageInfo: IPageInfo;
    edges: Array<IPlanetFilmsEdge>;
    totalCount: any;
    films: Array<IFilm>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPlanetFilmsEdge {
    node: IFilm;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IFilmSpeciesConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmSpeciesEdge>;
    totalCount: any;
    species: Array<ISpecies>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmSpeciesEdge {
    node: ISpecies;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IFilmStarshipsConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmStarshipsEdge>;
    totalCount: any;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmStarshipsEdge {
    node: IStarship;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IFilmVehiclesConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmVehiclesEdge>;
    totalCount: any;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmVehiclesEdge {
    node: IVehicle;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IFilmCharactersConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmCharactersEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmCharactersEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IFilmPlanetsConnection {
    pageInfo: IPageInfo;
    edges: Array<IFilmPlanetsEdge>;
    totalCount: any;
    planets: Array<IPlanet>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IFilmPlanetsEdge {
    node: IPlanet;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPeopleConnection {
    pageInfo: IPageInfo;
    edges: Array<IPeopleEdge>;
    totalCount: any;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPeopleEdge {
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IPlanetsConnection {
    pageInfo: IPageInfo;
    edges: Array<IPlanetsEdge>;
    totalCount: any;
    planets: Array<IPlanet>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IPlanetsEdge {
    node: IPlanet;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface ISpeciesConnection {
    pageInfo: IPageInfo;
    edges: Array<ISpeciesEdge>;
    totalCount: any;
    species: Array<ISpecies>;
  }

  /*
    description: An edge in a connection.
  */
  export interface ISpeciesEdge {
    node: ISpecies;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IStarshipsConnection {
    pageInfo: IPageInfo;
    edges: Array<IStarshipsEdge>;
    totalCount: any;
    starships: Array<IStarship>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IStarshipsEdge {
    node: IStarship;
    cursor: string;
  }

  /*
    description: A connection to a list of items.
  */
  export interface IVehiclesConnection {
    pageInfo: IPageInfo;
    edges: Array<IVehiclesEdge>;
    totalCount: any;
    vehicles: Array<IVehicle>;
  }

  /*
    description: An edge in a connection.
  */
  export interface IVehiclesEdge {
    node: IVehicle;
    cursor: string;
  }`
