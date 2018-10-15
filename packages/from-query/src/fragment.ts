// tslint:disable
/**
 * @file This file is an exploration into developing smarter support for fragments.
 * The most important piece of this right now is the piece that checks if a selectionset is exhaustive
 * With this piece we can generate more intelligent typings and greatly simplify the developer's life :)
 *
 * NOTE: You're probably looking for flattenQuery
 */

import { SelectionNode, GraphQLSchema, FieldNode, GraphQLNamedType, isAbstractType, GraphQLObjectType, InlineFragmentNode } from 'graphql';

/**
 * The goal here is to optimize fragments, in a few ways.
 *
 * 1. If we have the following query:
 *
 * ```gql
 * query {
 *  product {
 *    id
 *    # Product is an interface of ProductA & ProductB
 *    ... on ProductA {
 *      commonField
 *    }
 *    ... on ProductB {
 *      commonField
 *    }
 *  }
 * }
 * ```
 *
 * It should be transformed into:
 *
 * ```gql
 * query {
 *  product {
 *    id
 *    commonField
 *  }
 * }
 * ```
 *
 * 2. If we have
 *
 * ```gql
 * type Query {
 *   product: Product
 * }
 *
 * interface Product {
 *   id: ID!
 *   commonField: String
 * }
 *
 * type ProductA implements Product {
 *   id: ID!
 *   commonField: string
 *   fieldA: string
 * }
 *
 * type ProductB implements Product {
 *   id: ID!
 *   commonField: string
 *   fieldB: string
 * }
 *
 *  query {
 *    product {
 *      id
 *      ... on ProductA {
 *        fieldA
 *      }
 *
 *      ... on ProductB {
 *        fieldB
 *      }
 *    }
 *  }
 * ```
 *
 * We can generate query.product to be `{ id: string } & ({ fieldA: string } | { fieldB: string })`
 * since we know that the selectionset on the interface (or Union!) is exhaustive (i.e. all possible types are selected on)
 * We should also be able to merge down to `ProductA | ProductB` where
 * `ProductA = { id: string; fieldA: string }` and `ProductB = { id: string; fieldB: string }
 * This representation is probably more useful for developers importing the types or developing their code with the
 * definitions.
 */
export const isSelectionSetExhaustive: (originalNode: FieldNode, type: GraphQLNamedType, schema: GraphQLSchema) => boolean = (originalNode, type, schema) => {
  console.log('isExhaustive?')
  if (!originalNode.selectionSet || !originalNode.selectionSet.selections.length) { return true; }
  console.log('isExhaustive2?')
  // schema.getType(originalNode.)
  if (!isAbstractType(type)) {
    console.log('isExhaustive3?', type);
    return true;
  }

  const possibleTypes: ReadonlyArray<GraphQLObjectType> = schema.getPossibleTypes(type);

  const { inlineFragments } = originalNode.selectionSet.selections.reduce<{ fields: SelectionNode[]; inlineFragments: InlineFragmentNode[] }>((acc, selection) => {
    switch (selection.kind) {
      case 'Field':
      case 'FragmentSpread':
        acc.fields.push(selection);
        break;
      case 'InlineFragment':
        acc.inlineFragments.push(selection);
        break;
    }
    return acc;
  }, { fields: [], inlineFragments: [] });

  const selectedOnSet = new Set(inlineFragments.filter(frag => frag.typeCondition).map(frag => frag.typeCondition!.name.value));
  console.log('yo');
  console.log(possibleTypes.map(t => t.name), [...selectedOnSet])
  return possibleTypes.every(type => selectedOnSet.has(type.name));
}

export const expandFragments: (originalNode: FieldNode, type: GraphQLNamedType, schema: GraphQLSchema) => void = (oN, t, sch) => {
  if (!oN.selectionSet) { return []; }
  if (!isSelectionSetExhaustive(oN, t, sch)) {
    console.log('not exhaustive');
  } else {
    console.log('exhaustive');
    // console.log(oN.selectionSet);
    // const fields = oN.selectionSet!.selections.filter(x => x.kind === 'Field');
    // console.log(fields);
  }
}

const flattenFragments: (originalNode: FieldNode, type: GraphQLNamedType, schema: GraphQLSchema) => FieldNode = (originalNode, type, schema) => {
  if (!originalNode.selectionSet || !originalNode.selectionSet.selections.length) { return originalNode; }

  // schema.getType(originalNode.)
  if (!isAbstractType(type)) {
    return originalNode;
  }

  const possibleTypes: ReadonlyArray<GraphQLObjectType> = schema.getPossibleTypes(type);

  const newFieldNode: FieldNode = { ...originalNode };

  const { inlineFragments } = originalNode.selectionSet.selections.reduce<{ fields: SelectionNode[]; inlineFragments: InlineFragmentNode[] }>((acc, selection) => {
    switch (selection.kind) {
      case 'Field':
      case 'FragmentSpread':
        acc.fields.push(selection);
        break;
      case 'InlineFragment':
        acc.inlineFragments.push(selection);
        break;
    }
    return acc;
  }, { fields: [], inlineFragments: [] });

  const selectedOnSet = new Set(inlineFragments.filter(frag => frag.typeCondition).map(frag => frag.typeCondition!.name.value));

  if (!possibleTypes.every(type => selectedOnSet.has(type.name))) {
    console.log('not exhaustive');
    console.log([...selectedOnSet]);
    console.log([...possibleTypes.map(t => t.name)]);
    return originalNode;
  }

  console.log(`it's exhaustive`);

  return newFieldNode;
}

// const query = parse(`
//   query {
//     product {
//       id
//       ... on ProductA {
//         commonField
//       }

//       ... on ProductB {
//         commonField
//       }
//     }
//   }
// `);

// const schema = schemaFromInputs(`
//   type Query {
//     product: Product
//   }

//   interface Product {
//     id: ID!
//     commonField: String
//   }

//   type ProductA implements Product {
//     id: ID!
//     commonField: String
//     fieldA: String
//   }

//   type ProductB implements Product {
//     id: ID!
//     commonField: String
//     fieldB: String
//   }
// `);

// flattenFragments(
//   (query.definitions[0] as any as FieldNode).selectionSet!.selections[0] as FieldNode,
//   schema.getType('Product'),
//   schema
// );

export { flattenFragments };
