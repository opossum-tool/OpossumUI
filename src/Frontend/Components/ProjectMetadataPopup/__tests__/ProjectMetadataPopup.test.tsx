// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { ProjectMetadata } from '../../../../shared/shared-types';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { renderComponent } from '../../../test-helpers/render';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup';

describe('The ProjectMetadataPopup', () => {
  it('displays metadata', async () => {
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    await renderComponent(<ProjectMetadataPopup />, {
      actions: [setProjectMetadata(testMetadata)],
    });
    expect(screen.getByText('test-id')).toBeInTheDocument();
  });

  it('formats projectId, projectTitle and fileCreationDate', async () => {
    const testMetadata: ProjectMetadata = {
      projectTitle: 'Title',
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    await renderComponent(<ProjectMetadataPopup />, {
      actions: [setProjectMetadata(testMetadata)],
    });
    expect(screen.getByText('Project Title')).toBeInTheDocument();
    expect(screen.getByText('Project ID')).toBeInTheDocument();
    expect(screen.getByText('File Creation Date')).toBeInTheDocument();
  });

  it('displays custom user metadata', async () => {
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
      testObject: {
        foo: 'bar',
      },
    };

    await renderComponent(<ProjectMetadataPopup />, {
      actions: [setProjectMetadata(testMetadata)],
    });
    expect(screen.getByText('foo', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('bar', { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText('testObject', { exact: false }),
    ).toBeInTheDocument();
  });
});
