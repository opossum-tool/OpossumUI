// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import type { LinkedResourceTreeNodeData } from '../../../../../../ElectronBackend/api/resourceTree';
import { makeResourceTreeNode } from '../../../../../../testing/global-test-helpers';
import { OpossumColors } from '../../../../../shared-styles';
import { renderComponent } from '../../../../../test-helpers/render';
import { LinkedResourcesTreeNode } from '../LinkedResourcesTreeNode';

function makeLinkedResourceTreeNode(
  overrides: Partial<LinkedResourceTreeNodeData> &
    Pick<LinkedResourceTreeNodeData, 'id'>,
): LinkedResourceTreeNodeData {
  const { isDirectlyLinked = false, ...commonOverrides } = overrides;
  return {
    ...makeResourceTreeNode(commonOverrides),
    isDirectlyLinked,
  };
}

describe('LinkedResourcesTreeNode', () => {
  it('renders a file without information', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeLinkedResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
          isDirectlyLinked: true,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Directly linked')).toBeInTheDocument();
    expect(screen.queryByLabelText('Attribution icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder without information', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeLinkedResourceTreeNode({
          id: '/test/',
          labelText: 'Test label',
          isFile: false,
          canHaveChildren: true,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a breakpoint', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeLinkedResourceTreeNode({
          id: '/test/',
          labelText: 'Test label',
          isFile: false,
          canHaveChildren: true,
          isAttributionBreakpoint: true,
          isDirectlyLinked: true,
          isReadonly: true,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Directly linked')).toBeInTheDocument();
    expect(screen.getByLabelText('readonly resource')).toBeInTheDocument();
  });

  it('highlights a node matching the filters', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeLinkedResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
          matchesFilters: true,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByTestId('linked-resources-tree-node-/test')).toHaveStyle({
      backgroundColor: OpossumColors.lightBlue,
    });
  });

  it('does not highlight a node not matching the filters', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeLinkedResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
          matchesFilters: false,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByTestId('linked-resources-tree-node-/test'),
    ).not.toHaveStyle({ backgroundColor: OpossumColors.lightBlue });
  });
});
