// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { faker } from '../../../../../testing/Faker';
import { setResources } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../../test-helpers/render';
import { LinkedResourcesTree } from '../LinkedResourcesTree';

describe('LinkedResourcesTree', () => {
  const resourceIds = ['/folder1/folder2/resource_1', '/resource_2'];

  const expectedExpandedIds = [
    '/',
    '/folder1/',
    '/folder1/folder2/',
    '/folder1/folder2/resource_1',
  ];

  it('expands all folders', () => {
    renderComponent(<LinkedResourcesTree resourceIds={resourceIds} />);
    expect(screen.getByText('resource_1')).toBeInTheDocument();
    expect(screen.getByText('resource_2')).toBeInTheDocument();
  });

  it('changes the view, selectedResourceId and expandedResources when a resource is clicked', () => {
    const { store } = renderComponent(
      <LinkedResourcesTree resourceIds={resourceIds} />,
    );
    fireEvent.click(screen.getByText('resource_1'));

    expect(getSelectedResourceId(store.getState())).toBe(
      '/folder1/folder2/resource_1',
    );
    expect(getExpandedIds(store.getState())).toMatchObject(expectedExpandedIds);
  });

  it('collapses and expands folders', () => {
    renderComponent(<LinkedResourcesTree resourceIds={resourceIds} />, {
      actions: [
        setResources(
          faker.opossum.resources({
            folder1: {
              folder2: {
                resource_1: 1,
              },
            },
            resource_2: 1,
          }),
        ),
      ],
    });
    expect(screen.getByText('resource_1')).toBeInTheDocument();

    const collapseIcon = screen.getByLabelText('collapse /folder1/');
    fireEvent.click(collapseIcon);
    expect(screen.queryByText('resource_1')).not.toBeInTheDocument();

    const expandIcon = screen.getByLabelText('expand /folder1/');
    fireEvent.click(expandIcon);
    expect(screen.getByText('resource_1')).toBeInTheDocument();
  });
});
