// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { compact } from 'lodash';

import { setFilesWithChildren } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { PathBar } from '../PathBar';

describe('The PathBar', () => {
  it('renders a path', async () => {
    const testPath = '/test/path/foo/bar/';
    const pathElements = compact(testPath.split('/'));

    const { store } = await renderComponent(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
    });

    pathElements.forEach((element) => {
      expect(screen.getByText(element)).toBeInTheDocument();
    });
  });

  it('copies path to clipboard', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
      platform: 'MacIntel',
    });
    const testPath = '/test_path/';

    const { store } = await renderComponent(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
      store.dispatch(setFilesWithChildren(new Set<string>().add(testPath)));
    });

    fireEvent.click(screen.getByLabelText('copy path'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('test_path');
  });

  it('opens path URL in browser', async () => {
    const testPath = '/test_path/';
    await renderComponent(<PathBar />, {
      actions: [setSelectedResourceId(testPath)],
      data: getParsedInputFileEnrichedWithTestData({
        resources: { test_path: 1 },
        baseUrlsForSources: {
          [testPath]: 'https://www.othertesturl.com/code/{path}',
        },
      }),
    });
    const linkButton = await screen.findByRole('button', {
      name: 'Open resource in browser',
    });
    await userEvent.click(linkButton);
    expect(window.electronAPI.openLink).toHaveBeenCalledTimes(1);
  });
});
