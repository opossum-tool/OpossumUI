// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { faker } from '../../../testing/Faker';
import { setSelectedAttributionId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { renderHook } from '../../test-helpers/render';
import { useSelectedAttribution } from '../use-selected-attribution';

describe('useSelectedAttribution', () => {
  it('returns attribution data when selected and null when deselected', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = { [packageInfo.id]: packageInfo };

    const { result, store } = await renderHook(() => useSelectedAttribution(), {
      data: getParsedInputFileEnrichedWithTestData({ manualAttributions }),
      actions: [setSelectedAttributionId(packageInfo.id)],
    });

    await waitFor(() => {
      expect(result.current).toEqual(packageInfo);
    });

    act(() => {
      store.dispatch(setSelectedAttributionId(''));
    });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
});
