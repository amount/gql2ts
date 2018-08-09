// tslint:disable
/**
 * @file This is a work-in-progress attempt to flatten queries, in order to be able to process them easier
 * This could in the future be used for some optimization cases - at least parts of it can
 *
 * This was a quick hack I wrote on the couch to explore. This is not final and should not be used :D
 * (but it does seem to work without issues)
 */

import { parse, DocumentNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode } from "graphql";
import { print } from 'graphql/language/printer';
import { DefinitionNode, SelectionNode, OperationDefinitionNode, FieldNode } from 'graphql/language/ast';

const queryDefn = parse(`
  query {
    # ...FragmentTwo

    someField {
      ...FragmentTwo
      ... on Something {
        ... on Something {
          ... on Something {
            aField

            ...FragmentOne
          }
        }
      }
    }
  }

  fragment FragmentOne on Something {
    something
    ...FragmentTwo
    ... on Something {
      somethingElseAgain
      ... on Something {
        somethingElseAgainAgain
      }
    }

    ... on SomethingElse {
      nope
      ... on SomethingElse {
        nope2
        ... on SomethingElse {
          nope3
        }
      }
    }
  }

  fragment FragmentTwo on Something {
    somethingElse
  }
`);

/**
 * This builds an inline fragment from a FragmentSpread
 *
 * @param fragment The FragmentSpread
 * @param fragments A list of all included fragments (should be a Map in the future)
 */
const buildInlineFragment: (fragment: FragmentSpreadNode, fragments: FragmentDefinitionNode[]) => InlineFragmentNode = (fragment, otherFragments) => {
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
      selections: field.selectionSet.selections.map(selection => {
        if (selection.kind === 'FragmentSpread') {
          return buildInlineFragment(selection, fragments);
        } else if (selection.kind === 'InlineFragment') {
          selection = flattenFragment(selection, fragments) as InlineFragmentNode;
        }

        return recurseFields(selection, fragments);
      })
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
  const fragments: FragmentDefinitionNode[] = document.definitions.filter((defn): defn is FragmentDefinitionNode => defn.kind === 'FragmentDefinition');
  const definitions: DefinitionNode[] = document.definitions.map(defn => {
    if (defn.kind === 'FragmentDefinition') {
      return flattenWrapper(defn, fragments);
    } else if (defn.kind === 'OperationDefinition') {
      return inlineFragmentsInQuery(defn, fragments);
    }

    return defn;
  });

  return { ...document, definitions };
}

const stuff = flattenFragments(queryDefn);

console.log(print(stuff));
