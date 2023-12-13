// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createAppStore } from '../../../configure-store';
import { getFileSearch } from '../../../selectors/file-search-selectors';
import { setFileSearch } from '../file-search-actions';

describe('The fileSearch actions', () => {
  it('sets and gets fileSearch', () => {
    const testStore = createAppStore();
    expect(getFileSearch(testStore.getState())).toBe('');

    testStore.dispatch(setFileSearch('Test'));
    expect(getFileSearch(testStore.getState())).toBe('Test');
  });
});
