// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AppContainer } from '../AppContainer';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { IpcRenderer } from 'electron';

let originalIpcRenderer: IpcRenderer;

jest.mock('../../ResourceDetailsTabs/get-new-accordion-worker');

describe('The AppContainer', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders AppContainer', () => {
    renderComponentWithStore(<AppContainer />);
  });
});
