// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  isChildOf,
  removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty,
  removeFromSetCloneAndDeleteKeyFromObjectIfEmpty,
  replaceInArray,
} from '../lodash-extension-utils';

describe('replaceInArray', () => {
  test('replaces several instances of an item in an array', () => {
    const toBeReplaced = 'toBeReplaced';
    const replacement = 'replacement';
    const testArray: Array<string> = [toBeReplaced, 'x', toBeReplaced];
    const expectedArray: Array<string> = [replacement, 'x', replacement];

    expect(replaceInArray(testArray, toBeReplaced, replacement)).toEqual(
      expectedArray
    );
  });
});

describe('removeFromArrayAndDeleteArrayFromObjectIfEmpty', () => {
  test('removes value from array if other values are present', () => {
    const testObjectToMutate = {
      toModify: ['y', 'x'],
      toLeaveUntouched: ['y', 'x'],
    };
    const expectedObject = { toModify: ['x'], toLeaveUntouched: ['y', 'x'] };

    removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });

  test('removes key from object of the array is left empty after removal', () => {
    const testObjectToMutate = {
      toModify: ['y', 'y'],
      toLeaveUntouched: ['y', 'x'],
    };
    const expectedObject = { toLeaveUntouched: ['y', 'x'] };

    removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });

  test('does nothing if the key is not present in the object', () => {
    const testObjectToMutate = {
      toLeaveUntouched: ['y', 'x'],
    };
    const expectedObject = { toLeaveUntouched: ['y', 'x'] };

    removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });
});

describe('removeFromSetAndDeleteKeyFromObjectIfEmpty', () => {
  test('removes value from set if other values are present', () => {
    const testObjectToMutate = {
      toModify: new Set().add('y').add('x'),
      toLeaveUntouched: new Set().add('y').add('x'),
    };
    const expectedObject = {
      toModify: new Set().add('x'),
      toLeaveUntouched: new Set().add('y').add('x'),
    };

    removeFromSetCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });

  test('removes key from object of the set is left empty after removal', () => {
    const testObjectToMutate = {
      toModify: new Set().add('y'),
      toLeaveUntouched: new Set().add('y').add('x'),
    };
    const expectedObject = { toLeaveUntouched: new Set().add('y').add('x') };

    removeFromSetCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });

  test('does nothing if the key is not present in the object', () => {
    const testObjectToMutate = {
      toLeaveUntouched: new Set().add('y').add('x'),
    };
    const expectedObject = { toLeaveUntouched: new Set().add('y').add('x') };

    removeFromSetCloneAndDeleteKeyFromObjectIfEmpty(
      testObjectToMutate,
      'toModify',
      'y'
    );
    expect(testObjectToMutate).toEqual(expectedObject);
  });
});

describe('isChildOf', () => {
  it.each`
    testedItem             | parentId      | possibleChildId    | expectedReturn
    ${'a child'}           | ${'/folder/'} | ${'/folder/file'}  | ${true}
    ${'a non-child'}       | ${'/folder/'} | ${'/folder2/file'} | ${false}
    ${'same id'}           | ${'/folder/'} | ${'/folder/'}      | ${false}
    ${'non-folder parent'} | ${'/file'}    | ${'/file.txt'}     | ${false}
  `(
    'returns $returnValue for $testedItem',
    ({ parentId, possibleChildId, expectedReturn }) => {
      expect(isChildOf(parentId, possibleChildId)).toEqual(expectedReturn);
    }
  );
});
