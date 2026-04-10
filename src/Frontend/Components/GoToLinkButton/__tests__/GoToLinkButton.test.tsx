// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type BaseUrlsForSources } from '../../../../shared/shared-types';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { GoToLinkButton } from '../GoToLinkButton';

describe('The GoToLinkButton', () => {
  const testBaseUrlsForSources: BaseUrlsForSources = {
    '/parent_directory/': 'https://www.othertesturl.com/code/{path}',
    '/parent_directory/child_directory/':
      'https://www.testurl.com/code/{path}?base=123456789',
  };

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
    async (path: string, expected_link: string) => {
      await renderComponent(<GoToLinkButton />, {
        actions: [setSelectedResourceId(path)],
        data: getParsedInputFileEnrichedWithTestData({
          resources: {
            parent_directory: {
              child_directory: {
                directory_in_source_tree: { file: 1 },
              },
            },
          },
          baseUrlsForSources: testBaseUrlsForSources,
        }),
      });

      expect(window.electronAPI.openLink).toHaveBeenCalledTimes(0);
      const linkButton = await screen.findByRole('button', {
        name: 'Open resource in browser',
      });
      await userEvent.click(linkButton);

      expect(window.electronAPI.openLink).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.openLink).toHaveBeenCalledWith(expected_link);
    },
  );

  it('does not show link if base url of parent is null', async () => {
    const parentPath = '/parent_directory/';
    await renderComponent(<GoToLinkButton />, {
      actions: [setSelectedResourceId(parentPath)],
      data: getParsedInputFileEnrichedWithTestData({
        resources: { parent_directory: 1 },
        baseUrlsForSources: { [parentPath]: null },
      }),
    });

    expect(screen.getByLabelText('No link available')).toBeInTheDocument();
  });
});
