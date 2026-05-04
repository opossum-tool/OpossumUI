// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { PopupType } from '../../../enums/enums';
import { setIsPackageInfoDirty } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  getOpenFileRequest,
  getOpenPopup,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { BackendCommunication } from '../BackendCommunication';

describe('BackendCommunication', () => {
  it('stores the external file path in the unsaved-changes flow', async () => {
    const listeners = new Map<
      AllowedFrontendChannels,
      (event: IpcRendererEvent, ...args: Array<unknown>) => void
    >();

    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      listeners.set(
        channel,
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      );
      return vi.fn();
    });

    const { store } = await renderComponent(<BackendCommunication />, {
      actions: [setIsPackageInfoDirty(true)],
    });
    const filePath = '/path/to/project.opossum';

    listeners.get(AllowedFrontendChannels.OpenFileWithUnsavedCheck)?.(
      {} as IpcRendererEvent,
      filePath,
    );

    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
    expect(getOpenFileRequest(store.getState())).toEqual({ filePath });
  });
});
