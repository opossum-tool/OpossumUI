// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup';
import { ProjectMetadata } from '../../../../shared/shared-types';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('The ProjectMetadataPopup', () => {
  test('displays metadata', () => {
    const store = createTestAppStore();
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    store.dispatch(setProjectMetadata(testMetadata));

    renderComponentWithStore(<ProjectMetadataPopup />, { store });
    expect(screen.queryByText('test-id')).toBeTruthy();
  });

  test('formats projectId, projectTitle and fileCreationDate', () => {
    const store = createTestAppStore();
    const testMetadata: ProjectMetadata = {
      projectTitle: 'Title',
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    store.dispatch(setProjectMetadata(testMetadata));

    renderComponentWithStore(<ProjectMetadataPopup />, { store });
    expect(screen.queryByText('Project Title')).toBeTruthy();
    expect(screen.queryByText('Project ID')).toBeTruthy();
    expect(screen.queryByText('File Creation Date')).toBeTruthy();
  });

  test('displays custom user metadata', () => {
    const store = createTestAppStore();
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
      testObject: {
        foo: 'bar',
      },
    };

    store.dispatch(setProjectMetadata(testMetadata));

    renderComponentWithStore(<ProjectMetadataPopup />, { store });
    expect(screen.queryByText('foo', { exact: false })).toBeTruthy();
    expect(screen.queryByText('bar', { exact: false })).toBeTruthy();
    expect(screen.queryByText('testObject', { exact: false })).toBeTruthy();
  });
});
