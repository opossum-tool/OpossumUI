// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createAppStore } from '../../../configure-store';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionIdInAttributionView,
  getTargetSelectedAttributionId,
} from '../../../selectors/attribution-view-resource-selectors';
import {
  setMultiSelectSelectedAttributionIds,
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../attribution-view-simple-actions';

describe('The load and navigation simple actions', () => {
  it('sets and gets selectedAttributionId', () => {
    const testStore = createAppStore();
    expect(
      getSelectedAttributionIdInAttributionView(testStore.getState()),
    ).toBe('');

    testStore.dispatch(setSelectedAttributionId('Test'));
    expect(
      getSelectedAttributionIdInAttributionView(testStore.getState()),
    ).toBe('Test');
  });

  it('sets and gets targetSelectedAttributionId', () => {
    const testStore = createAppStore();
    expect(getTargetSelectedAttributionId(testStore.getState())).toBeNull();

    testStore.dispatch(setTargetSelectedAttributionId('test'));
    expect(getTargetSelectedAttributionId(testStore.getState())).toBe('test');
  });

  it('sets and gets multiSelectSelectedAttributionIds', () => {
    const testStore = createAppStore();
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState()),
    ).toStrictEqual([]);

    testStore.dispatch(setMultiSelectSelectedAttributionIds(['id_1']));
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState()),
    ).toStrictEqual(['id_1']);
  });
});
