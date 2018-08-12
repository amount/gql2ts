// tslint:disable
/**
 * @file This is a work-in-progress attempt to flatten queries, in order to be able to process them easier
 * This could in the future be used for some optimization cases - at least parts of it can
 *
 * This was a quick hack I wrote on the couch to explore. This is not final and should not be used :D
 * (but it does seem to work without issues)
 */

import { DocumentNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode } from "graphql";
import { DefinitionNode, SelectionNode, OperationDefinitionNode, FieldNode } from 'graphql/language/ast';

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
    return buildInlineFragment(fragment, fragments);
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
 * Wraps the {@link flattenFragment} function due to poor typing on my part
 * @param fragment Fragment to be flattened
 * @param fragments List of fragments
 */
const flattenWrapper: (fragment: FragmentDefinitionNode, fragments: FragmentDefinitionNode[]) => FragmentDefinitionNode = (fragment, fragments) => {
  return flattenFragment(fragment, fragments) as any as FragmentDefinitionNode;
}

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

/**
 * Recursively iterates over selection sets and flattens/inlines fragments
 * @param field Field that we're flattening
 * @param fragments A List of fragments
 */
const recurseFields = (field: FieldNode | InlineFragmentNode, fragments: FragmentDefinitionNode[]) => {
  if (!field.selectionSet) { return field; }

  return {
    ...field,
    selectionSet: {
      ...field.selectionSet,
      selections: field.selectionSet.selections.reduce((selections, selection) => {
        if (selection.kind === 'FragmentSpread') {
          return [...selections, buildInlineFragment(selection, fragments)];
        } else if (selection.kind === 'InlineFragment') {
          const { current, preceding } = flattenAdjacentFragments(
            flattenFragment(selection, fragments) as InlineFragmentNode,
            selections
          );

          return [...preceding, ...current.map(sel => recurseFields(sel as any, fragments))]
        }

        return [
          ...selections,
          recurseFields(selection, fragments)
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
const inlineFragmentsInQuery: (query: OperationDefinitionNode, fragments: FragmentDefinitionNode[]) => OperationDefinitionNode = (query, fragments) => {
  return recurseFields(query as any as FieldNode, fragments) as any as OperationDefinitionNode;
}

/**
 * This function flattens queries by:
 *  - inlining FragmentSpreads
 *  - flattening fragments of the same type
 *
 * @param document A parsed Query
 */
export const flattenFragments: (document: DocumentNode) => DocumentNode = document => {
  const [fragments, others] = document.definitions.reduce<[FragmentDefinitionNode[], DefinitionNode[]]>(
    (acc, defn) => defn.kind === 'FragmentDefinition' ?
      [acc[0].concat(defn), acc[1]] :
      [acc[0], acc[1].concat(defn)],
    [[], []]
  );

  const flattenedFragments: FragmentDefinitionNode[] = fragments.map(defn => flattenWrapper(defn, fragments));

  const definitions: DefinitionNode[] = others.map(defn => {
    if (defn.kind === 'OperationDefinition') {
      return inlineFragmentsInQuery(defn, flattenedFragments);
    }

    return defn;
  });

  return { ...document, definitions };
}
