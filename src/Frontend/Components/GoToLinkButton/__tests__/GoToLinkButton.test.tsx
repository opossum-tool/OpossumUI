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
import { screen } from '@testing-library/react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import each from 'jest-each';
import { clickGoToLinkIcon } from '../../../test-helpers/attribution-column-test-helpers';
import { act } from 'react-dom/test-utils';

describe('The GoToLinkButton', () => {
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
      act(() => {
        store.dispatch(setSelectedResourceId(path));
        store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));
      });

      expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(0);
      expect(screen.getByLabelText('link to open'));
      clickGoToLinkIcon(screen, 'link to open');

      expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
      expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
        IpcChannel.OpenLink,
        { link: expected_link }
      );
    }
  );

  it('does not show link if base url of parent is null ', () => {
    const parentPath = '/parent_directory/';
    const testBaseUrlsForSources: BaseUrlsForSources = {
      [parentPath]: null,
    };
    const { store } = renderComponentWithStore(<GoToLinkButton />);
    store.dispatch(setSelectedResourceId(parentPath));
    store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));

    expect(screen.getByLabelText('link to open')).toHaveStyle(
      'visibility: hidden'
    );
  });
});
