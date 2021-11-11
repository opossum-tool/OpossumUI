// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  EMPTY_PARSED_FILE_CONTENT,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { IpcRenderer } from 'electron';
import { ParsedFileContent } from '../../../../shared/shared-types';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import {
  clickGoToLinkIcon,
  expectGoToLinkIconIsNotVisible,
  expectGoToLinkIconIsVisible,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

describe('The go to link button', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    const mockInvoke = jest.fn();
    mockInvoke.mockReturnValue(Promise.resolve());
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: mockInvoke,
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('is visible and opens link in external browser', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        parent_with_breakpoint: { 'something.js': 1 },
        parent: { 'something_else.js': 1 },
      },
      attributionBreakpoints: new Set<string>().add('/parent_with_breakpoint/'),
      baseUrlsForSources: {
        '/': 'https://www.testurl.com/code/{path}?base=123456789',
      },
    };
    const expectedLinkForParent =
      'https://www.testurl.com/code/parent?base=123456789';
    const expectedLinkForFile =
      'https://www.testurl.com/code/parent/something_else.js?base=123456789';

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'parent_with_breakpoint');
    expectGoToLinkIconIsNotVisible(screen);
    clickOnElementInResourceBrowser(screen, 'something.js');
    expectGoToLinkIconIsNotVisible(screen);

    clickOnElementInResourceBrowser(screen, 'parent');
    expectGoToLinkIconIsVisible(screen);
    clickGoToLinkIcon(screen, 'link to open');
    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['OpenLink'],
      { link: expectedLinkForParent }
    );

    clickOnElementInResourceBrowser(screen, 'something_else.js');
    expectGoToLinkIconIsVisible(screen);
    clickGoToLinkIcon(screen, 'link to open');
    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(2);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['OpenLink'],
      { link: expectedLinkForFile }
    );
  });
});
