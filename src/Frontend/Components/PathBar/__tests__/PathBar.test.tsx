// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';
import { compact } from 'lodash';

import {
  setBaseUrlsForSources,
  setFilesWithChildren,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PathBar } from '../PathBar';

const writeText = jest.fn();

describe('The PathBar', () => {
  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: { writeText },
    });
  });

  it('renders a path', () => {
    const testPath = '/test/path/foo/bar/';
    const pathElements = compact(testPath.split('/'));

    const { store } = renderComponentWithStore(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
    });

    pathElements.forEach((element) => {
      expect(screen.getByText(element));
    });
  });

  it('copies path to clipboard', () => {
    const testPath = '/test_path/';

    const { store } = renderComponentWithStore(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
      store.dispatch(setFilesWithChildren(new Set<string>().add(testPath)));
    });

    fireEvent.click(screen.getByLabelText('copy path'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('test_path');
  });

  it('opens path URL in browser', () => {
    const testPath = '/test_path/';

    const { store } = renderComponentWithStore(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
      store.dispatch(setFilesWithChildren(new Set<string>().add(testPath)));
      store.dispatch(
        setBaseUrlsForSources({
          [testPath]: 'https://www.othertesturl.com/code/{path}',
        }),
      );
    });

    fireEvent.click(screen.getByLabelText('open resource in browser'));

    expect(window.electronAPI.openLink).toHaveBeenCalledTimes(1);
  });
});
