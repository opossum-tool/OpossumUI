// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { Criticality } from '../../../../../shared/shared-types';
import {
  expectResourceVisibility,
  expectTreeItemHighlight,
} from '../../../../../testing/ui';
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
  const { data } = useLinkedResourcesTree({
    enabled,
    onAttributionUuids,
    search,
  });
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
    expect(screen.getAllByLabelText('Directly linked')).toHaveLength(2);
    expect(
      within(
        screen.getByTestId('linked-resources-tree-node-/folder1/'),
      ).queryByLabelText('Directly linked'),
    ).not.toBeInTheDocument();
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
    expect(store.getState().resourceState.attributionSelectionPolicy).toBe(
      'preserve',
    );
  });

  it('collapses and expands folders', async () => {
    await renderComponent(
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
      { data: testData },
    );

    await expectResourceVisibility(['resource_1'], [], 'linked-resources-tree');

    fireEvent.click(screen.getByLabelText('collapse /folder1/'));

    await expectResourceVisibility([], ['resource_1'], 'linked-resources-tree');

    fireEvent.click(screen.getByLabelText('expand /folder1/'));

    await expectResourceVisibility(['resource_1'], [], 'linked-resources-tree');
  });

  it('does not highlight linked resources when no search is active', async () => {
    await renderComponent(
      <TestLinkedResourcesTree onAttributionUuids={[testUuid]} />,
      { data: testData },
    );

    await expectTreeItemHighlight('linked-resources-tree', 'resource_2', false);
    await expectTreeItemHighlight('linked-resources-tree', 'resource_1', false);
  });

  it('filters the tree to matching linked resources and highlights them during search', async () => {
    await renderComponent(
      <TestLinkedResourcesTree
        onAttributionUuids={[testUuid]}
        search={'resource_1'}
      />,
      { data: testData },
    );

    await expectTreeItemHighlight('linked-resources-tree', 'resource_1', true);
    await expectResourceVisibility([], ['resource_2'], 'linked-resources-tree');
  });

  it('highlights folders whose own name matches the search', async () => {
    await renderComponent(
      <TestLinkedResourcesTree
        onAttributionUuids={[testUuid]}
        search={'folder'}
      />,
      { data: testData },
    );

    await expectTreeItemHighlight('linked-resources-tree', 'folder1', true);
    await expectTreeItemHighlight('linked-resources-tree', 'folder2', true);
    await expectTreeItemHighlight('linked-resources-tree', 'resource_1', false);
    await expectResourceVisibility([], ['resource_2'], 'linked-resources-tree');
  });
});
