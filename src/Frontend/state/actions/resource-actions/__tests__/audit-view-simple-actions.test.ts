// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createAppStore } from '../../../configure-store';
import {
  getAttributionSelectionPendingResourceId,
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetAttributionRelation,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../../selectors/resource-selectors';
import {
  completeAttributionSelection,
  setExpandedIds,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetAttributionRelation,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';

describe('The audit view simple actions', () => {
  it('sets and gets selectedResourceId', () => {
    const testStore = createAppStore();
    testStore.dispatch(setSelectedResourceId('test', 'auto'));
    expect(getSelectedResourceId(testStore.getState())).toBe('test');
    expect(getAttributionSelectionPendingResourceId(testStore.getState())).toBe(
      'test',
    );
  });

  it('keeps an automatic selection pending when selecting the current resource again', () => {
    const store = createAppStore();
    store.dispatch(setSelectedResourceId('/resource', 'auto'));
    store.dispatch(setSelectedResourceId('/resource', 'auto'));

    expect(getAttributionSelectionPendingResourceId(store.getState())).toBe(
      '/resource',
    );
  });

  it('does not restart completed selection when selecting the current resource again', () => {
    const store = createAppStore();
    store.dispatch(setSelectedResourceId('/resource', 'auto'));
    store.dispatch(completeAttributionSelection('/resource'));
    store.dispatch(setSelectedResourceId('/resource', 'auto'));

    expect(
      getAttributionSelectionPendingResourceId(store.getState()),
    ).toBeNull();
  });

  it.each(['/resource', '/other-resource'])(
    'cancels pending selection when preserving selection at %s',
    (resourceId) => {
      const store = createAppStore();
      store.dispatch(setSelectedAttributionId('reviewed-attribution'));
      store.dispatch(setSelectedResourceId('/resource', 'auto'));
      store.dispatch(setSelectedResourceId(resourceId, 'preserve'));

      expect(
        getAttributionSelectionPendingResourceId(store.getState()),
      ).toBeNull();

      store.dispatch(completeAttributionSelection('/resource'));

      expect(getSelectedResourceId(store.getState())).toBe(resourceId);
      expect(getSelectedAttributionId(store.getState())).toBe(
        'reviewed-attribution',
      );
      expect(
        getAttributionSelectionPendingResourceId(store.getState()),
      ).toBeNull();
    },
  );

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

  it('sets and gets targetAttributionRelation', () => {
    const testStore = createAppStore();
    expect(getTargetAttributionRelation(testStore.getState())).toBeNull();

    testStore.dispatch(setTargetAttributionRelation('resource'));

    expect(getTargetAttributionRelation(testStore.getState())).toBe('resource');
  });
});
