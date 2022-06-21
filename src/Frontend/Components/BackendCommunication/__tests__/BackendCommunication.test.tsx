// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { BackendCommunication } from '../BackendCommunication';

describe('BackendCommunication', () => {
  test('renders an Open file icon', () => {
    renderComponentWithStore(<BackendCommunication />);
    expect(window.ipcRenderer.on).toHaveBeenCalledTimes(9);
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.FileLoaded,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.Logging,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ResetLoadedFile,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ExportFileRequest,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ShowSearchPopup,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ShowProjectMetadataPopup,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ShowProjectStatisticsPopup,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.SetBaseURLForRoot,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ToggleHighlightForCriticalSignals,
      expect.anything()
    );
  });
});
