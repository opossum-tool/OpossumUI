// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { setSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { renderHook } from '../../test-helpers/render';
import { setDatabaseInitialized } from '../backendClient';
import { useRootSelectionWhenDatabaseInitializes } from '../use-root-selection-when-database-initializes';

const selectedResourceId = '/src/from-the-same-file.ts';

describe('useRootSelectionWhenDatabaseInitializes', () => {
  it('resets the selection to the root resource when the database initializes', async () => {
    const { store } = await renderHook(() =>
      useRootSelectionWhenDatabaseInitializes(),
    );

    act(() => {
      store.dispatch(setSelectedResourceId(selectedResourceId));
    });
    expect(getSelectedResourceId(store.getState())).toBe(selectedResourceId);

    act(() => {
      setDatabaseInitialized(true);
    });

    expect(getSelectedResourceId(store.getState())).toBe('/');
  });

  it('resets the selection on mount when the database is already initialized', async () => {
    setDatabaseInitialized(true);

    const { store } = await renderHook(() =>
      useRootSelectionWhenDatabaseInitializes(),
    );

    expect(getSelectedResourceId(store.getState())).toBe('/');
  });

  it('keeps the selection while the database is not initialized', async () => {
    const { store } = await renderHook(() =>
      useRootSelectionWhenDatabaseInitializes(),
    );

    act(() => {
      store.dispatch(setSelectedResourceId(selectedResourceId));
    });

    expect(getSelectedResourceId(store.getState())).toBe(selectedResourceId);
  });
});
