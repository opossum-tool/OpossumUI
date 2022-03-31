// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PathBar } from '../PathBar';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { setFilesWithChildren } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { act, screen } from '@testing-library/react';

describe('The PathBar', () => {
  test('renders a path', () => {
    const testPath = '/test_path';

    const { store } = renderComponentWithStore(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
    });

    expect(screen.getByText(testPath));
  });

  test('renders a path of a file with children', () => {
    const testPath = '/test_path/';

    const { store } = renderComponentWithStore(<PathBar />);
    act(() => {
      store.dispatch(setSelectedResourceId(testPath));
      store.dispatch(setFilesWithChildren(new Set<string>().add(testPath)));
    });

    expect(screen.getByText(testPath.slice(0, -1)));
  });
});
