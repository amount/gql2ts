// @ts-ignore

// tslint:disable
/**
 * @file This is a work-in-progress attempt to flatten queries, in order to be able to process them easier
 * This could in the future be used for some optimization cases - at least parts of it can
 *
 * This was a quick hack I wrote on the couch to explore. This is not final and should not be used :D
 * (but it does seem to work without issues)
 */

import { DocumentNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode, GraphQLSchema, GraphQLType } from "graphql";
import { DefinitionNode, SelectionNode, OperationDefinitionNode, FieldNode } from 'graphql/language/ast';
import { unwrapType } from './ir';

/**
 * This builds an inline fragment from a FragmentSpread
 *
 * @param fragment The FragmentSpread
 * @param fragments A list of all included fragments (should be a Map in the future)
 */
const buildInlineFragment: (fragment: FragmentSpreadNode, fragments: FragmentDefinitionNode[]) => InlineFragmentNode = (fragment, otherFragments) => {
  // can convert this to a map later
  const referencedFragment = otherFragments.find(frag => fragment.name.value === frag.name.value);

  if (!referencedFragment) { throw new Error('Invalid Fragment Selection'); }

  return {
    kind: 'InlineFragment',
    directives: fragment.directives,
    loc: fragment.loc,
    selectionSet: referencedFragment.selectionSet,
    typeCondition: referencedFragment.typeCondition
  };
}

/**
 * This recursively "flattens" a fragment by:
 * - Inlining Fragment spreads
 * - Combining nested fragments on the same type
 *
 * @param fragment The fragment to be flattened
 * @param fragments A list of all fragments
 */
const flattenFragment: (fragment: FragmentDefinitionNode | FragmentSpreadNode | InlineFragmentNode, fragments: FragmentDefinitionNode[]) => FragmentDefinitionNode | InlineFragmentNode = (fragment, fragments) => {
  if (fragment.kind === 'FragmentSpread') {
    const inlined = buildInlineFragment(fragment, fragments);
    return flattenFragment(inlined, fragments);
  };

  const selections = fragment.selectionSet.selections.reduce<SelectionNode[]>((selections, selection) => {
    if (selection.kind === 'Field') { return [...selections, selection as SelectionNode]; }

    const inlinedFragment = flattenFragment(selection, fragments);

    if (!inlinedFragment.typeCondition || !fragment.typeCondition || inlinedFragment.typeCondition.name.value !== fragment.typeCondition.name.value) {
      return [...selections, inlinedFragment as SelectionNode];
    }

    return [...selections, ...inlinedFragment.selectionSet.selections];
  }, []);

  return {
    ...fragment,
    selectionSet: {
      ...fragment.selectionSet,
      selections
    }
  };
};

/**
 * Flattens adjacent fragments of the same type and removes unnecessary fragments
 */
const flattenAdjacentFragments: (fragment: InlineFragmentNode, precedingFields: SelectionNode[]) => { current: SelectionNode[]; preceding: SelectionNode[] } = (fragment, precedingFields) => {
  if (!fragment.typeCondition) {
    // flatten fragments that don't require
    return { current: [...fragment.selectionSet.selections], preceding: precedingFields };
  }

  const precedingInlineFragments: InlineFragmentNode[] = precedingFields.filter((field): field is InlineFragmentNode => field.kind === 'InlineFragment');

  if (!precedingInlineFragments.length) {
    return { current: [fragment], preceding: precedingFields };
  }

  const targetTypeCondition: string = fragment.typeCondition.name.value;

  // @TODO groupBy instead
  const matchingFragment: InlineFragmentNode | undefined = precedingInlineFragments.find(({ typeCondition }) => !!typeCondition && typeCondition.name.value === targetTypeCondition);
  if (!matchingFragment) { return { current: [fragment], preceding: precedingFields }; }

  const nonMatchingFragments: InlineFragmentNode[] = precedingInlineFragments.filter(({ typeCondition }) => !!typeCondition && typeCondition.name.value !== targetTypeCondition);

  return {
    current: [{
      ...fragment,
      selectionSet: {
        kind: 'SelectionSet',
        ...matchingFragment.selectionSet,
        selections: [
          ...matchingFragment.selectionSet.selections,
          ...fragment.selectionSet.selections
        ]
      }
    }],
    preceding: [...nonMatchingFragments]
  };
}

const extractProperType = (selection: SelectionNode, currentNode: GraphQLType, schema: GraphQLSchema): GraphQLType => {
  if (selection.kind === 'InlineFragment' && selection.typeCondition) {
    return schema.getType(selection.typeCondition.name.value) || currentNode;
  }

  return currentNode;
}

/**
 * Recursively iterates over selection sets and flattens/inlines fragments
 * @param field Field that we're flattening
 * @param fragments A List of fragments
 */
const recurseFields = (field: FieldNode | InlineFragmentNode, fragments: FragmentDefinitionNode[], schemaNode: GraphQLType, schema: GraphQLSchema): FieldNode | InlineFragmentNode => {
  if (!field.selectionSet) { return field; }

  return {
    ...field,
    selectionSet: {
      ...field.selectionSet,
      selections: field.selectionSet.selections.reduce((selections, selection) => {
        if (selection.kind === 'FragmentSpread') {
          const inlinedFragment = flattenFragment(selection, fragments);
          if (inlinedFragment.typeCondition && inlinedFragment.typeCondition.name.value === unwrapType(schemaNode).name) {
            return [...selections, ...inlinedFragment.selectionSet.selections];
          }
          return [...selections, recurseFields(buildInlineFragment(selection, fragments), fragments, schemaNode, schema)];
        } else if (selection.kind === 'InlineFragment') {
          const { current, preceding } = flattenAdjacentFragments(
            flattenFragment(selection, fragments) as InlineFragmentNode,
            selections
          );

          return [...preceding, ...current.map(sel => recurseFields(sel as any, fragments, extractProperType(sel, unwrapType(schemaNode), schema), schema))]
        }

        const field = (schemaNode as any).getFields ? (schemaNode as any).getFields()[selection.name.value] : null;

        return [
          ...selections,
          recurseFields(selection, fragments, field ? unwrapType(field.type) : null!, schema)
        ];
      }, [] as SelectionNode[])
    }
  };
}

/**
 * This wraps {@link recurseFields} because the types are messy
 * @param query The operation definition
 * @param fragments list of fragments
 */
const inlineFragmentsInQuery: (query: OperationDefinitionNode, fragments: FragmentDefinitionNode[], schemaNode: GraphQLType, schema: GraphQLSchema) => OperationDefinitionNode = (query, fragments, schemaNode, schema) => {
  return recurseFields(query as any as FieldNode, fragments, schemaNode, schema) as any as OperationDefinitionNode;
}

/**
 * This wraps {@link recurseFields} because the types are messy
 * @param query The operation definition
 * @param fragments list of fragments
 */
const inlineFragmentsInQueryFragment: (query: FragmentDefinitionNode, fragments: FragmentDefinitionNode[], schemaNode: GraphQLType, schema: GraphQLSchema) => FragmentDefinitionNode = (query, fragments, schemaNode, schema) => {
  return recurseFields(query as any as FieldNode, fragments, schemaNode, schema) as any as FragmentDefinitionNode;
}

/**
 * This function flattens queries by:
 *  - inlining FragmentSpreads
 *  - flattening fragments of the same type
 *
 * @param document A parsed Query
 * @param schema A parsed Schema
 */
export const flattenFragments: (document: DocumentNode, schema: GraphQLSchema) => DocumentNode = (document, schema) => {
  const [fragments, others] = document.definitions.reduce<[FragmentDefinitionNode[], DefinitionNode[]]>(
    (acc, defn) => defn.kind === 'FragmentDefinition' ?
      [acc[0].concat(defn), acc[1]] :
      [acc[0], acc[1].concat(defn)],
    [[], []]
  );

  // First inline the fragments
  const flattenedFragments: FragmentDefinitionNode[] = fragments.map((frag, _i, frags) =>
    inlineFragmentsInQueryFragment(frag, frags, schema.getType(frag.typeCondition.name.value)!, schema)
  );

  // Next, flatten
  const definitions: DefinitionNode[] = others.map(defn => {
    if (defn.kind === 'OperationDefinition') {
      // nested ternary, whatever
      const type: GraphQLType | null | undefined = defn.operation === 'query' ?
        schema.getQueryType() :
        defn.operation === 'mutation' ?
          schema.getMutationType() :
          schema.getSubscriptionType();

      if (!type) { throw new Error(`Missing Operation ${defn.operation} in Schema`); }
      return inlineFragmentsInQuery(defn, flattenedFragments, type, schema);
    }

    return defn;
  });

  return { ...document, definitions };
}
