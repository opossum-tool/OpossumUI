// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup';
import { ProjectMetadata } from '../../../../shared/shared-types';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('The ProjectMetadataPopup', () => {
  it('displays metadata', () => {
    const store = createTestAppStore();
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    store.dispatch(setProjectMetadata(testMetadata));

    renderComponentWithStore(<ProjectMetadataPopup />, { store });
    expect(screen.getByText('test-id')).toBeInTheDocument();
  });

  it('formats projectId, projectTitle and fileCreationDate', () => {
    const store = createTestAppStore();
    const testMetadata: ProjectMetadata = {
      projectTitle: 'Title',
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    store.dispatch(setProjectMetadata(testMetadata));

    renderComponentWithStore(<ProjectMetadataPopup />, { store });
    expect(screen.getByText('Project Title')).toBeInTheDocument();
    expect(screen.getByText('Project ID')).toBeInTheDocument();
    expect(screen.getByText('File Creation Date')).toBeInTheDocument();
  });

  it('displays custom user metadata', () => {
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
    expect(screen.getByText('foo', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('bar', { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText('testObject', { exact: false }),
    ).toBeInTheDocument();
  });
});
