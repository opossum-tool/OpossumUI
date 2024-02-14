// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createAppStore } from '../../../configure-store';
import {
  getSelectedAttributionId,
  getTargetSelectedAttributionId,
} from '../../../selectors/resource-selectors';
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../attribution-view-simple-actions';

describe('The load and navigation simple actions', () => {
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
