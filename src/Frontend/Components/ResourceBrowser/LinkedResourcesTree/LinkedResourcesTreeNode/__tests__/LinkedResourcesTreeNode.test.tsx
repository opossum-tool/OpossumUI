// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';

import { makeResourceTreeNode } from '../../../../../../testing/global-test-helpers';
import { renderComponent } from '../../../../../test-helpers/render';
import { LinkedResourcesTreeNode } from '../LinkedResourcesTreeNode';

describe('LinkedResourcesTreeNode', () => {
  it('renders a file without information', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.queryByLabelText('Attribution icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder without information', async () => {
    await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeResourceTreeNode({
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
        resource={makeResourceTreeNode({
          id: '/test/',
          labelText: 'Test label',
          isFile: false,
          canHaveChildren: true,
          isAttributionBreakpoint: true,
        })}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });

  it('highlights a node matching the filters', async () => {
    const { container } = await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
          matchesFilters: true,
        })}
      />,
    );

    expect(within(container).getByText('Test label')).toBeInTheDocument();
  });

  it('does not highlight a node not matching the filters', async () => {
    const { container } = await renderComponent(
      <LinkedResourcesTreeNode
        resource={makeResourceTreeNode({
          id: '/test',
          labelText: 'Test label',
          matchesFilters: false,
        })}
      />,
    );

    expect(within(container).getByText('Test label')).toBeInTheDocument();
  });
});
