// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PathBar } from '../PathBar';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { setFilesWithChildren } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('The PathBar', () => {
  test('renders a path', () => {
    const testPath = '/test_path';

    const { getByText, store } = renderComponentWithStore(<PathBar />);
    store.dispatch(setSelectedResourceId(testPath));

    expect(getByText(testPath));
  });

  test('renders a path of a file with children', () => {
    const testPath = '/test_path/';

    const { getByText, store } = renderComponentWithStore(<PathBar />);
    store.dispatch(setSelectedResourceId(testPath));
    store.dispatch(setFilesWithChildren(new Set<string>().add(testPath)));

    expect(getByText(testPath.slice(0, -1)));
  });
});
