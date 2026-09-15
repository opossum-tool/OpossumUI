// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import type { ResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import {
  makeResourceTreeNode,
  ROOT_TREE_NODE,
} from '../../../../testing/global-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { VirtualizedTree } from '../VirtualizedTree';
import * as virtualizedTreeNodeUtil from '../VirtualizedTreeNode/VirtualizedTreeNode.util';

describe('The VirtualizedTree', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('renders VirtualizedTree', async () => {
    const resources: Array<ResourceTreeNodeData> = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/thirdParty/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/thirdParty/package_1.tr.gz' }),
      makeResourceTreeNode({ id: '/thirdParty/package_2.tr.gz' }),
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({
        id: '/root/src/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/root/src/something.js' }),
      makeResourceTreeNode({ id: '/root/package.json' }),
      makeResourceTreeNode({
        id: '/docs/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/docs/readme.md' }),
    ];

    await renderComponent(
      <VirtualizedTree
        resources={resources}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        selectedNodeId={'/thirdParty/'}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
      />,
    );

    for (const label of [
      '/',
      'thirdParty',
      'package_1.tr.gz',
      'package_2.tr.gz',
      'root',
      'src',
      'something.js',
      'package.json',
      'docs',
      'readme.md',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('ignores an expansion response after filters change', async () => {
    let resolveExpansion: (nodeIds: Array<string>) => void;
    const expansion = new Promise<Array<string>>((resolve) => {
      resolveExpansion = resolve;
    });
    const getNodeIdsToExpand = vi
      .spyOn(virtualizedTreeNodeUtil, 'getNodeIdsToExpand')
      .mockReturnValue(expansion);
    const onToggle = vi.fn();
    const resources = [
      makeResourceTreeNode({
        id: '/folder/',
        isExpandable: true,
        canHaveChildren: true,
        isExpanded: false,
      }),
    ];
    const firstFilters = { search: 'first' };
    const secondFilters = { search: 'second' };
    const renderTree = (expansionFilters: { search: string }) => (
      <VirtualizedTree
        resources={resources}
        onSelect={vi.fn()}
        onToggle={onToggle}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
        expansionFilters={expansionFilters}
      />
    );

    const { rerender } = await renderComponent(renderTree(firstFilters));
    fireEvent.click(screen.getByLabelText('expand /folder/'));

    await waitFor(() =>
      expect(getNodeIdsToExpand).toHaveBeenCalledWith('/folder/', {
        search: 'first',
      }),
    );
    rerender(renderTree(secondFilters));
    await act(() =>
      Promise.resolve().then(() => {
        resolveExpansion!(['/folder/']);
      }),
    );

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('expands the full chain through the mouse with the active filters', async () => {
    const getNodeIdsToExpand = vi
      .spyOn(virtualizedTreeNodeUtil, 'getNodeIdsToExpand')
      .mockResolvedValue([
        '/folder/',
        '/folder/child/',
        '/folder/child/grandchild/',
      ]);
    const onToggle = vi.fn();
    const filters = { search: 'match' };
    const resources = [
      makeResourceTreeNode({
        id: '/folder/',
        isExpandable: true,
        canHaveChildren: true,
        isExpanded: false,
      }),
    ];

    await renderComponent(
      <VirtualizedTree
        resources={resources}
        onSelect={vi.fn()}
        onToggle={onToggle}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
        expansionFilters={filters}
      />,
    );
    fireEvent.click(screen.getByLabelText('expand /folder/'));

    await waitFor(() =>
      expect(getNodeIdsToExpand).toHaveBeenCalledWith('/folder/', filters),
    );
    expect(onToggle).toHaveBeenCalledWith([
      '/folder/',
      '/folder/child/',
      '/folder/child/grandchild/',
    ]);
  });

  it('collapses an expanded branch without requesting expansion', async () => {
    const getNodeIdsToExpand = vi.spyOn(
      virtualizedTreeNodeUtil,
      'getNodeIdsToExpand',
    );
    const onToggle = vi.fn();

    await renderComponent(
      <VirtualizedTree
        resources={[
          makeResourceTreeNode({
            id: '/folder/',
            isExpandable: true,
            canHaveChildren: true,
            isExpanded: true,
          }),
        ]}
        onSelect={vi.fn()}
        onToggle={onToggle}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
        expansionFilters={{ search: 'match' }}
      />,
    );

    fireEvent.click(screen.getByLabelText('collapse /folder/'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(['/folder/']);
    expect(getNodeIdsToExpand).not.toHaveBeenCalled();
  });

  it('accepts a pending response after an unrelated rerender with stable filters', async () => {
    let resolveExpansion: (nodeIds: Array<string>) => void;
    const expansion = new Promise<Array<string>>((resolve) => {
      resolveExpansion = resolve;
    });
    vi.spyOn(virtualizedTreeNodeUtil, 'getNodeIdsToExpand').mockReturnValue(
      expansion,
    );
    const onToggle = vi.fn();
    const filters = { search: 'match' };
    const renderTree = (selectedNodeId?: string) => (
      <VirtualizedTree
        resources={[
          makeResourceTreeNode({
            id: '/folder/',
            isExpandable: true,
            canHaveChildren: true,
            isExpanded: false,
          }),
        ]}
        onSelect={vi.fn()}
        onToggle={onToggle}
        selectedNodeId={selectedNodeId}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
        expansionFilters={filters}
      />
    );

    const { rerender } = await renderComponent(renderTree());
    fireEvent.click(screen.getByLabelText('expand /folder/'));
    rerender(renderTree('/folder/'));
    await act(() =>
      Promise.resolve().then(() => {
        resolveExpansion!(['/folder/', '/folder/child/']);
      }),
    );

    expect(onToggle).toHaveBeenCalledWith(['/folder/', '/folder/child/']);
  });
});
