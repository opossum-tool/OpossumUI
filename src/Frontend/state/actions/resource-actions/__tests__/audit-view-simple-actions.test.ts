// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createAppStore } from '../../../configure-store';
import {
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../../selectors/resource-selectors';
import {
  setExpandedIds,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';

describe('The audit view simple actions', () => {
  it('sets and gets selectedResourceId', () => {
    const testStore = createAppStore();
    testStore.dispatch(setSelectedResourceId('test'));
    expect(getSelectedResourceId(testStore.getState())).toBe('test');
  });

  it('sets and gets targetSelectedResourceId', () => {
    const testTargetSelectedResourceId = 'test_id';
    const testStore = createAppStore();
    testStore.dispatch(
      setTargetSelectedResourceId(testTargetSelectedResourceId),
    );
    expect(getTargetSelectedResourceId(testStore.getState())).toBe(
      testTargetSelectedResourceId,
    );
  });

  it('sets and gets expandedIds', () => {
    const testExpandedIds: Array<string> = ['/folder1/', '/folder2/'];

    const testStore = createAppStore();
    expect(getExpandedIds(testStore.getState())).toEqual(['/']);

    testStore.dispatch(setExpandedIds(testExpandedIds));
    expect(getExpandedIds(testStore.getState())).toEqual(testExpandedIds);
  });

  it('sets and gets selectedAttributionId', () => {
    const testStore = createAppStore();
    expect(getSelectedAttributionId(testStore.getState())).toBe('');

    testStore.dispatch(setSelectedAttributionId('Test'));
    expect(getSelectedAttributionId(testStore.getState())).toBe('Test');
  });

  it('sets and gets targetSelectedAttributionId', () => {
    const testStore = createAppStore();
    expect(getTargetSelectedAttributionId(testStore.getState())).toBeNull();

    testStore.dispatch(setTargetSelectedAttributionId('test'));
    expect(getTargetSelectedAttributionId(testStore.getState())).toBe('test');
  });
});
