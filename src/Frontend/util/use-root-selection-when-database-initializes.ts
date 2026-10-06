// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { ROOT_PATH } from '../shared-constants';
import { setSelectedResourceId } from '../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch } from '../state/hooks';
import { useDatabaseInitialized } from './backendClient';

/**
 * Whenever the backend finishes loading (a new) file, the selection is reset
 * to the root resource. The root is the resource with id 1 in the database,
 * so no stale path from a previously loaded file can be passed to queries.
 */
export function useRootSelectionWhenDatabaseInitializes(): void {
  const dispatch = useAppDispatch();
  const databaseInitialized = useDatabaseInitialized();

  useEffect(() => {
    if (databaseInitialized) {
      dispatch(setSelectedResourceId(ROOT_PATH));
    }
  }, [databaseInitialized, dispatch]);
}
