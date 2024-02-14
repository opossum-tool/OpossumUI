// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { BaseUrlsForSources } from '../../../../shared/shared-types';
import { setBaseUrlsForSources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { renderComponent } from '../../../test-helpers/render';
import { GoToLinkButton } from '../GoToLinkButton';

describe('The GoToLinkButton', () => {
  it.each([
    [
      '/parent_directory/child_directory/directory_in_source_tree/file',
      'https://www.testurl.com/code/directory_in_source_tree/file?base=123456789',
    ],
    [
      '/parent_directory/child_directory/',
      'https://www.testurl.com/code/?base=123456789',
    ],
  ])(
    'navigates to correct link for %s',
    (path: string, expected_link: string) => {
      const testBaseUrlsForSources: BaseUrlsForSources = {
        '/parent_directory/': 'https://www.othertesturl.com/code/{path}',
        '/parent_directory/child_directory/':
          'https://www.testurl.com/code/{path}?base=123456789',
      };
      const { store } = renderComponent(<GoToLinkButton />);
      act(() => {
        store.dispatch(setSelectedResourceId(path));
        store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));
      });

      expect(window.electronAPI.openLink).toHaveBeenCalledTimes(0);
      expect(
        screen.getByLabelText('Open resource in browser'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('link to open'));

      expect(window.electronAPI.openLink).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.openLink).toHaveBeenCalledWith(expected_link);
    },
  );

  it('does not show link if base url of parent is null', () => {
    const parentPath = '/parent_directory/';
    const testBaseUrlsForSources: BaseUrlsForSources = {
      [parentPath]: null,
    };
    const { store } = renderComponent(<GoToLinkButton />);
    store.dispatch(setSelectedResourceId(parentPath));
    store.dispatch(setBaseUrlsForSources(testBaseUrlsForSources));

    expect(screen.getByLabelText('No link available')).toBeInTheDocument();
  });
});
