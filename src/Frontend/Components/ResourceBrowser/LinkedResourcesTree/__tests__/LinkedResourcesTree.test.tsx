/* eslint-disable testing-library/no-node-access */
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { Criticality } from '../../../../../shared/shared-types';
import { OpossumColors } from '../../../../shared-styles';
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { LinkedResourcesTree } from '../LinkedResourcesTree';
import { useLinkedResourcesTree } from '../useLinkedResourcesTreeState';

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

function TestLinkedResourcesTree({
  enabled = true,
  onAttributionUuids,
  search,
}: {
  enabled?: boolean;
  onAttributionUuids: Array<string>;
  search?: string;
}) {
  const { data } = useLinkedResourcesTree({ enabled, onAttributionUuids, search });
  return data ? <LinkedResourcesTree state={data} /> : null;
}

describe('LinkedResourcesTree', () => {
  it('renders linked resources for given attribution', async () => {
    await renderComponent(
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });
    expect(screen.getByText('resource_2')).toBeInTheDocument();
  });

  it('waits for enabled before loading linked resources', async () => {
    const api = vi.mocked(window.electronAPI.api);
    api.mockClear();
    const { rerender } = await renderComponent(
      <TestLinkedResourcesTree
        enabled={false}
        onAttributionUuids={[testUuid]}
      />,
      { data: testData },
    );

    expect(api).not.toHaveBeenCalledWith(
      'getResourcePathsAndParentsForAttributions',
      expect.anything(),
    );

    rerender(<TestLinkedResourcesTree onAttributionUuids={[testUuid]} />);

    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        'getResourcePathsAndParentsForAttributions',
        expect.objectContaining({ attributionUuids: [testUuid] }),
      ),
    );
  });

  it('dispatches selectedResourceId when a resource is clicked', async () => {
    const { store } = await renderComponent(
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
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
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
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

  it('does not highlight linked resources when no search is active', async () => {
    await renderComponent(
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });

    expect(screen.getByText('resource_1').closest('div')).not.toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
    expect(screen.getByText('resource_2').closest('div')).not.toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
  });

  it('filters the tree to matching linked resources and highlights them during search', async () => {
    await renderComponent(
      <TestLinkedResourcesTree
        onAttributionUuids={[testUuid]}
        search={'resource_1'}
      />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });

    expect(screen.getByText('resource_1').closest('div')).toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
    expect(screen.queryByText('resource_2')).not.toBeInTheDocument();
  });

  it('highlights folders whose own name matches the search', async () => {
    await renderComponent(
      <TestLinkedResourcesTree
        onAttributionUuids={[testUuid]}
        search={'folder'}
      />,
      { data: testData },
    );

    await waitFor(() => {
      expect(screen.getByText('resource_1')).toBeInTheDocument();
    });

    expect(screen.getByText('folder1').closest('div')).toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
    expect(screen.getByText('folder2').closest('div')).toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
    expect(screen.getByText('resource_1').closest('div')).not.toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
    expect(screen.queryByText('resource_2')).not.toBeInTheDocument();
  });
});
