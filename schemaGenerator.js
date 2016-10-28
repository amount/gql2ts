"use strict";
var graphql_1 = require('graphql');
var ColorType = new graphql_1.GraphQLEnumType({
    name: 'Color',
    values: {
        RED: { value: 0 },
        GREEN: { value: 1 },
        BLUE: { value: 2 }
    }
});
var QueryType = new graphql_1.GraphQLObjectType({
    name: 'Query',
    fields: {
        colorEnum: {
            type: ColorType
        }
    }
});
var schema = new graphql_1.GraphQLSchema({ query: QueryType });
var value = graphql_1.graphql(schema, graphql_1.introspectionQuery);
value.then(function (x) { return console.log(JSON.stringify(x, null, 2)); });
