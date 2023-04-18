// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { remove } from 'lodash';
import { isIdOfResourceWithChildren } from './can-resource-have-children';

export function replaceInArray<T>(
  array: Array<T>,
  itemToReplace: T,
  replacement: T
): Array<T> {
  for (let index = 0; index < array.length; index++) {
    if (array[index] === itemToReplace) {
      array[index] = replacement;
    }
  }

  return array;
}

export function removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<string, Array<T>>,
  arrayKey: string,
  elementToRemove: T
): void {
  if (!object[arrayKey]) {
    return;
  }

  object[arrayKey] = [...object[arrayKey]];
  remove(object[arrayKey], (element: T) => {
    return element === elementToRemove;
  });

  if (!object[arrayKey].length) {
    delete object[arrayKey];
  }
}

export function removeFromSetCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<number, Set<T>>,
  setKey: number,
  element: T
): void;
export function removeFromSetCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<string, Set<T>>,
  setKey: string,
  element: T
): void;
export function removeFromSetCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<string | number, Set<T>>,
  setKey: string | number,
  element: T
): void {
  if (!object[setKey]) {
    return;
  }

  if (object[setKey].size > 1) {
    object[setKey] = new Set(object[setKey]);
    object[setKey].delete(element);
  } else {
    delete object[setKey];
  }
}

export function isChildOf(parentId: string, possibleChildId: string): boolean {
  if (!isIdOfResourceWithChildren(parentId) || possibleChildId === parentId) {
    return false;
  }

  return possibleChildId.includes(parentId);
}
