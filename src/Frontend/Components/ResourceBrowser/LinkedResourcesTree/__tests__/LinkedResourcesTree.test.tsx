// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { Criticality } from '../../../../../shared/shared-types';
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { LinkedResourcesTree } from '../LinkedResourcesTree';

const testUuid = 'test-attribution-uuid';

const testData = getParsedInputFileEnrichedWithTestData({
  resources: {
    folder1: {
      folder2: {
        resource_1: 1,
      },
    },
    resource_2: 1,
  },
  externalAttributions: {
    [testUuid]: {
      packageName: 'test-package',
      criticality: Criticality.None,
      id: testUuid,
    },
  },
  resourcesToExternalAttributions: {
    '/folder1/folder2/resource_1': [testUuid],
    '/resource_2': [testUuid],
  },
});

describe('LinkedResourcesTree', () => {
  it('renders linked resources for given attribution', async () => {
    await renderComponent(
      <LinkedResourcesTree attributionUuids={[testUuid]} />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });
    expect(screen.getByText('resource_2')).toBeInTheDocument();
  });

  it('dispatches selectedResourceId when a resource is clicked', async () => {
    const { store } = await renderComponent(
      <LinkedResourcesTree attributionUuids={[testUuid]} />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('resource_1'));

    expect(getSelectedResourceId(store.getState())).toBe(
      '/folder1/folder2/resource_1',
    );
  });

  it('collapses and expands folders', async () => {
    await renderComponent(
      <LinkedResourcesTree attributionUuids={[testUuid]} />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });

    const collapseIcon = screen.getByLabelText('collapse /folder1/');
    fireEvent.click(collapseIcon);

    await waitFor(() => {
      expect(screen.queryByText('resource_1')).not.toBeInTheDocument();
    });

    const expandIcon = screen.getByLabelText('expand /folder1/');
    fireEvent.click(expandIcon);

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });
  });
});
