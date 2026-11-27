// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { DEFAULT_PANEL_SIZES } from '../../../../shared/shared-constants';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import type { PanelWidthSetting } from '../../../state/variables/use-panel-sizes';
import { renderComponent } from '../../../test-helpers/render';
import { ResizableBox } from '../../ResizableBox/ResizableBox';
import { WorkspaceSidePanel } from '../workspace-side-panel';

vi.mock('../../ResizableBox/ResizableBox', () => ({
  ResizableBox: vi.fn(({ children }: ComponentProps<typeof ResizableBox>) => (
    <>{children}</>
  )),
}));

describe('WorkspaceSidePanel', () => {
  it.each([
    'resourceBrowserWidth',
    'packageListsWidth',
    'aiReviewResourceBrowserWidth',
    'aiReviewPackageListsWidth',
  ] satisfies Array<PanelWidthSetting>)(
    'saves the rendered width for %s without changing other panel sizes',
    async (widthSetting) => {
      const { store } = await renderComponent(
        <WorkspaceSidePanel widthSetting={widthSetting} resizeFrom="right">
          Panel content
        </WorkspaceSidePanel>,
      );
      const props = vi.mocked(ResizableBox).mock.lastCall?.[0];
      const panel = document.createElement('div');
      vi.spyOn(panel, 'offsetWidth', 'get').mockReturnValue(420);

      act(() => {
        props?.onResizeStop?.(new MouseEvent('mouseup'), 'right', panel, {
          // The library's drag delta need not match the CSS-constrained width.
          width: 1000,
          height: 0,
        });
      });

      const expectedPanelSizes = {
        ...DEFAULT_PANEL_SIZES,
        [widthSetting]: 420,
      };
      expect(store.getState().userSettingsState.panelSizes).toEqual(
        expectedPanelSizes,
      );
      expect(window.electronAPI.updateUserSettings).toHaveBeenCalledWith({
        panelSizes: expectedPanelSizes,
      });
    },
  );

  it('passes responsive limits without overwriting an oversized saved preference', async () => {
    await renderComponent(
      <WorkspaceSidePanel
        widthSetting="aiReviewResourceBrowserWidth"
        resizeFrom="left"
      >
        Panel content
      </WorkspaceSidePanel>,
      {
        actions: [
          setUserSetting({
            panelSizes: {
              ...DEFAULT_PANEL_SIZES,
              aiReviewResourceBrowserWidth: 5000,
            },
          }),
        ],
      },
    );

    expect(vi.mocked(ResizableBox).mock.lastCall?.[0]).toMatchObject({
      size: { width: 5000 },
      minWidth: '10%',
      maxWidth: '40%',
      enable: { left: true },
      bounds: 'parent',
      boundsByDirection: true,
    });
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
  });
});
