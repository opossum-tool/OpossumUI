// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import {
  isAttributionViewSelected,
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../state/selectors/view-selector';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { TopBar } from '../TopBar';
import { IpcChannel } from '../../../../shared/ipc-channels';

let originalIpcRenderer: IpcRenderer;

describe('TopBar', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders an Open file icon', () => {
    const { store } = renderComponentWithStore(<TopBar />);
    expect(window.ipcRenderer.on).toHaveBeenCalledTimes(7);
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['FileLoaded'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['Logging'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['ResetLoadedFile'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['ExportFileRequest'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['ShowSearchPopup'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['ShowProjectMetadataPopup'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['SetBaseURLForRoot'],
      expect.anything()
    );

    fireEvent.click(screen.queryByLabelText('open file') as Element);
    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['OpenFile']
    );
  });

  test('switches between views', () => {
    const { store } = renderComponentWithStore(<TopBar />);

    fireEvent.click(screen.queryByText('Audit') as Element);
    expect(isAuditViewSelected(store.getState())).toBe(true);
    expect(isAttributionViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.queryByText('Attribution') as Element);
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isAttributionViewSelected(store.getState())).toBe(true);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.queryByText('Report') as Element);
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isAttributionViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(true);
  });
});
