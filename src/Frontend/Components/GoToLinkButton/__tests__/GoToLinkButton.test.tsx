// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { GoToLinkButton } from '../GoToLinkButton';
import { BaseUrlsForSources } from '../../../../shared/shared-types';
import { setBaseUrlsForSources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { IpcRenderer } from 'electron';
import { screen } from '@testing-library/react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { clickGoToLinkButton } from '../../../test-helpers/test-helpers';

let originalIpcRenderer: IpcRenderer;

describe('The GoToLinkButton', () => {
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

  test('navigates to correct link', () => {
    const testPath =
      '/parent_directory/child_directory/directory_in_source_tree/file';
    const testBaseUrlsForSources: BaseUrlsForSources = {
      '/parent_directory/child_directory/':
        'https://www.testurl.com/code/{path}?base=123456789',
    };
    const expectedLink =
      'https://www.testurl.com/code/directory_in_source_tree/file?base=123456789';

    const { store } = renderComponentWithStore(<GoToLinkButton />);
    store.dispatch(setSelectedResourceId(testPath));
    store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(0);
    expect(screen.getByLabelText('open link in browser'));
    clickGoToLinkButton(screen);

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['OpenLink'],
      { link: expectedLink }
    );
  });
});
