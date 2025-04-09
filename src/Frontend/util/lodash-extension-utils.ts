// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { omit as _omit, pick as _pick, remove } from 'lodash';

export function replaceInArray<T>(
  array: Array<T>,
  itemToReplace: T,
  replacement: T,
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
  elementToRemove: T,
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
  element: T,
): void;
export function removeFromSetCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<string, Set<T>>,
  setKey: string,
  element: T,
): void;
export function removeFromSetCloneAndDeleteKeyFromObjectIfEmpty<T>(
  object: Record<string | number, Set<T>>,
  setKey: string | number,
  element: T,
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

/** Improves the lodash pick typing by correctly inferring the type of keys */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: Array<K>,
): Pick<T, K> {
  return _pick(object, keys);
}

/** Improves the lodash omit typing by correctly inferring the type of keys */
export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: Array<K>,
): Omit<T, K> {
  return _omit(object, keys);
}

/** Moves the first n elements of an array to the end */
export function moveElementsToEnd<T>(arr: Array<T>, n: number): Array<T> {
  if (n > arr.length) {
    throw new Error('n is larger than the array length');
  }
  const elementsToMove = arr.slice(0, n);
  const remainingElements = arr.slice(n);
  return [...remainingElements, ...elementsToMove];
}
