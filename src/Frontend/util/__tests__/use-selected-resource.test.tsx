// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';

import { pathsToResources } from '../../../testing/global-test-helpers';
import { setSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { renderHook } from '../../test-helpers/render';
import { useIsSelectedResourceReadonly } from '../use-selected-resource';

describe('useIsSelectedResourceReadonly', () => {
  it('identifies a readonly structural ancestor', async () => {
    const { result } = await renderHook(() => useIsSelectedResourceReadonly(), {
      actions: [setSelectedResourceId('/')],
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/editable/file.ts']),
        readonlyRules: [
          { path: '/', readonly: true },
          { path: '/editable', readonly: false },
        ],
      }),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });
});
