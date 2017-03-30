import { GenerateSubTypeInterface } from './types';
import { FieldNode } from 'graphql';

export interface ISubtypeMetadata {
  name: string;
  dupe: boolean;
}
export type SubtypeNamerAndDedupe =
  (selection: FieldNode, declaration: string, generateSubTypeInterfaceName: GenerateSubTypeInterface) => ISubtypeMetadata | null;

export const GenerateSubtypeCache: () => SubtypeNamerAndDedupe = () => {
  const GeneratedSubtypes: Map<string, string> = new Map();
  const compareNoWhitespace: (a: string, b: string) => boolean = (a, b) => a.replace(/\s/g, '') === b.replace(/\s/g, '');

  const subTypeCacheHit: (name: string, declaration: string) => boolean = (name, declaration) =>
    compareNoWhitespace(GeneratedSubtypes.get(name)!, declaration);

  const generateEnumeratedName: (name: string, count: number) => string = (name, count) => `${name}${count}`;

  const enumerateSubtypes: (name: string, declaration: string) => ISubtypeMetadata = (name, declaration) => {
    if (!GeneratedSubtypes.has(name) || subTypeCacheHit(name, declaration)) {
      return { name, dupe: subTypeCacheHit(name, declaration) };
    }

    let i: number = 1;
    while (true) {
      let tempName: string = generateEnumeratedName(name, i);
      if (GeneratedSubtypes.has(tempName) && !subTypeCacheHit(tempName, declaration)) {
        i++;
        continue;
      } else {
        if (GeneratedSubtypes.has(tempName)) {
          return { name: tempName, dupe: true };
        } else {
          GeneratedSubtypes.set(tempName, declaration);
          return { name: tempName, dupe: false };
        }
      }
    }
  };

  const subTypeStuff: (name: string | null, declaration: string) => ISubtypeMetadata | null = (subtype, declaration) => {
    if (!subtype) { return subtype as null; };

    if (GeneratedSubtypes.has(subtype)) {
      return enumerateSubtypes(subtype, declaration);
    } else {
      GeneratedSubtypes.set(subtype, declaration);
    }

    return { name: subtype, dupe: false };
  };

  const getSubtype: SubtypeNamerAndDedupe = (selection, declaration, generateSubTypeInterfaceName) =>
    subTypeStuff(generateSubTypeInterfaceName(selection.name.value, selection), declaration);

  return getSubtype;
};
