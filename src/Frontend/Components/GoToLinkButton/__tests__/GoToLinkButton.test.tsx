// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
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
import each from 'jest-each';
import { clickGoToLinkIcon } from '../../../test-helpers/attribution-column-test-helpers';

let originalIpcRenderer: IpcRenderer;

describe('The GoToLinkButton', () => {
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

  each([
    [
      '/parent_directory/child_directory/directory_in_source_tree/file',
      'https://www.testurl.com/code/directory_in_source_tree/file?base=123456789',
    ],
    [
      '/parent_directory/child_directory/',
      'https://www.testurl.com/code/?base=123456789',
    ],
  ]).test(
    'navigates to correct link for %s',
    (path: string, expected_link: string) => {
      const testBaseUrlsForSources: BaseUrlsForSources = {
        '/parent_directory/': 'https://www.othertesturl.com/code/{path}',
        '/parent_directory/child_directory/':
          'https://www.testurl.com/code/{path}?base=123456789',
      };
      const { store } = renderComponentWithStore(<GoToLinkButton />);
      store.dispatch(setSelectedResourceId(path));
      store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));

      expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(0);
      expect(screen.getByLabelText('link to open'));
      clickGoToLinkIcon(screen, 'link to open');

      expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
      expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
        IpcChannel['OpenLink'],
        { link: expected_link }
      );
    }
  );
});
