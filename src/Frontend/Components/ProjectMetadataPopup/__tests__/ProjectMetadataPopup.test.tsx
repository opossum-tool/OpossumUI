// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { type ProjectMetadata } from '../../../../shared/shared-types';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup';

describe('The ProjectMetadataPopup', () => {
  it('displays metadata', async () => {
    const testMetadata: ProjectMetadata = {
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    await renderComponent(<ProjectMetadataPopup />, {
      data: getParsedInputFileEnrichedWithTestData({ metadata: testMetadata }),
    });
    expect(await screen.findByText('test-id')).toBeInTheDocument();
  });

  it('formats projectId, projectTitle and fileCreationDate', async () => {
    const testMetadata: ProjectMetadata = {
      projectTitle: 'Title',
      projectId: 'test-id',
      fileCreationDate: 'test-date',
    };

    await renderComponent(<ProjectMetadataPopup />, {
      data: getParsedInputFileEnrichedWithTestData({ metadata: testMetadata }),
    });
    expect(await screen.findByText('Project Title')).toBeInTheDocument();
    expect(await screen.findByText('Project ID')).toBeInTheDocument();
    expect(await screen.findByText('File Creation Date')).toBeInTheDocument();
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
      data: getParsedInputFileEnrichedWithTestData({ metadata: testMetadata }),
    });
    expect(
      await screen.findByText('foo', { exact: false }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('bar', { exact: false }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('testObject', { exact: false }),
    ).toBeInTheDocument();
  });
});
