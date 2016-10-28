import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLEnumType,
  introspectionQuery
} from 'graphql';

var ColorType = new GraphQLEnumType({
  name: 'Color',
  values: {
    RED: { value: 0 },
    GREEN: { value: 1 },
    BLUE: { value: 2 },
  }
});

var QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    colorEnum: {
      type: ColorType
    }
  }
});

var schema = new GraphQLSchema({ query: QueryType });

let value = graphql(schema, introspectionQuery);

value.then(x => console.log(JSON.stringify(x, null, 2)));
