// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { faker } from '../../../../../../testing/Faker';
import { setAttributionBreakpoints } from '../../../../../state/actions/resource-actions/all-views-simple-actions';
import { renderComponent } from '../../../../../test-helpers/render';
import { LinkedResourcesTreeNode } from '../LinkedResourcesTreeNode';

describe('LinkedResourcesTreeNode', () => {
  it('renders a file without information', () => {
    renderComponent(
      <LinkedResourcesTreeNode
        nodeName={'Test label'}
        node={1}
        nodeId={faker.system.filePath()}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.queryByLabelText('Attribution icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder without information', () => {
    renderComponent(
      <LinkedResourcesTreeNode
        nodeName={'Test label'}
        node={faker.opossum.resources()}
        nodeId={faker.system.filePath()}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a breakpoint', () => {
    const nodeId = faker.system.filePath();
    renderComponent(
      <LinkedResourcesTreeNode
        nodeName={'Test label'}
        node={faker.opossum.resources()}
        nodeId={nodeId}
      />,
      { actions: [setAttributionBreakpoints(new Set([nodeId]))] },
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });
});
