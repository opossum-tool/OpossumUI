// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import { renderHook } from '../../../test-helpers/render';
import { usePanelSizes } from '../use-panel-sizes';

describe('usePanelSizes', () => {
  it('merges resize updates for independent widths', async () => {
    const { result, store } = await renderHook(() => usePanelSizes());

    expect(result.current.panelSizes.packageListsWidth).toBe(360);
    expect(result.current.panelSizes.aiReviewPackageListsWidth).toBe(360);
    expect(result.current.panelSizes.resourceBrowserWidth).toBe(340);
    expect(result.current.panelSizes.aiReviewResourceBrowserWidth).toBe(340);

    act(() => {
      result.current.setPanelSizes({ packageListsWidth: 420 });
      result.current.setPanelSizes({
        aiReviewResourceBrowserWidth: 460,
      });
    });

    await waitFor(() => {
      expect(store.getState().userSettingsState.panelSizes).toMatchObject({
        packageListsWidth: 420,
        aiReviewResourceBrowserWidth: 460,
      });
    });
    expect(store.getState().userSettingsState.panelSizes).toMatchObject({
      resourceBrowserWidth:
        DEFAULT_USER_SETTINGS.panelSizes.resourceBrowserWidth,
      aiReviewPackageListsWidth:
        DEFAULT_USER_SETTINGS.panelSizes.aiReviewPackageListsWidth,
    });
    expect(window.electronAPI.updateUserSettings).toHaveBeenCalledWith({
      panelSizes: {
        ...DEFAULT_USER_SETTINGS.panelSizes,
        packageListsWidth: 420,
        aiReviewResourceBrowserWidth: 460,
      },
    });
  });
});
