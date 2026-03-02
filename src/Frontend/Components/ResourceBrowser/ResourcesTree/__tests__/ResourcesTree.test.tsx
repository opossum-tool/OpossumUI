/* eslint-disable testing-library/no-node-access */
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  fireEvent,
  Screen,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { Criticality } from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import {
  makeResourceTreeNode,
  ROOT_TREE_NODE,
} from '../../../../../testing/global-test-helpers';
import { ROOT_PATH } from '../../../../shared-constants';
import { setConfig } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import { setUserSetting } from '../../../../state/actions/user-settings-actions/user-settings-actions';
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { ResourcesTree } from '../ResourcesTree';

const defaultData = getParsedInputFileEnrichedWithTestData({
  resources: {
    root: { 'child.js': 1 },
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
      'jQuery.js': 1,
    },
  },
});

describe('ResourcesTree', () => {
  it('renders tree nodes from provided resources', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({
        id: '/thirdParty/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('thirdParty')).toBeInTheDocument();
  });

  it('dispatches setSelectedResourceId on click', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
    ];

    const { store } = await renderComponent(
      <ResourcesTree resources={resources} />,
      { data: defaultData },
    );

    fireEvent.click(screen.getByText('root'));
    await waitFor(() => {
      expect(getSelectedResourceId(store.getState())).toBe('/root/');
    });
  });

  it('renders correct icon for directory containing signals', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        containsExternalAttribution: true,
        containsResourcesWithOnlyExternalAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon containing signals',
    );
  });

  it('renders correct icon for directory with signal and criticality icon', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/src/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasExternalAttribution: true,
        hasUnresolvedExternalAttribution: true,
        criticality: Criticality.High,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(screen, 'src', 'Directory icon with signal');
    expectIconToExist(screen, 'Criticality icon', 'src', true);
  });

  it('renders correct icon for file without information', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({ id: '/something.js' }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'something.js',
      'File icon without information',
    );
    expectIconToExist(screen, 'Criticality icon', 'something.js', false);
  });

  it('renders correct icon for directory with attribution', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasManualAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon with attribution',
    );
  });

  it('renders correct icon for directory without information', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/empty/',
        isExpandable: false,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'empty',
      'Directory icon without information',
    );
  });

  it('renders correct icon for file with attribution', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/file.ts',
        hasManualAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'file.ts',
      'File icon with attribution',
    );
  });

  it('renders correct icon for file with signal and criticality', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/file.ts',
        hasManualAttribution: true,
        hasExternalAttribution: true,
        hasUnresolvedExternalAttribution: true,
        criticality: Criticality.High,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'file.ts',
      'File icon with attribution',
    );
    expectIconToExist(screen, 'Criticality icon', 'file.ts', true);
  });

  it('renders correct icon for directory containing attributions', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        containsManualAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon containing attributions',
    );
  });

  it('renders correct icon for directory with parent attribution', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasParentWithManualAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon with parent attribution',
    );
  });

  it('renders correct icon for directory with all children containing signal also containing attributions', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        containsExternalAttribution: true,
        containsResourcesWithOnlyExternalAttribution: false,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon with all children containing signal also containing attributions',
    );
  });

  it('renders breakpoint icon', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        isAttributionBreakpoint: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectIconToExist(screen, 'Breakpoint icon', 'root', true);
  });

  it('hides criticality icon when showCriticality is disabled', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/src/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasExternalAttribution: true,
        hasUnresolvedExternalAttribution: true,
        criticality: Criticality.High,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
      actions: [setUserSetting({ showCriticality: false })],
    });

    expectResourceIconLabelToBe(screen, 'src', 'Directory icon with signal');
    expectIconToExist(screen, 'Criticality icon', 'src', false);
    expectIconToExist(screen, 'Signal icon', 'src', true);
  });

  it('renders classification icon when showClassifications is enabled', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/src/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasExternalAttribution: true,
        hasUnresolvedExternalAttribution: true,
        classification: 1,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
      actions: [
        setConfig({
          classifications: { 1: faker.opossum.classificationEntry() },
        }),
        setUserSetting({ showClassifications: true }),
      ],
    });

    expectIconToExist(screen, 'Classification icon', 'src', true);
  });

  it('hides classification icon when showClassifications is disabled', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/src/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        hasExternalAttribution: true,
        hasUnresolvedExternalAttribution: true,
        classification: 1,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
      actions: [
        setConfig({
          classifications: { 1: faker.opossum.classificationEntry() },
        }),
        setUserSetting({ showClassifications: false }),
      ],
    });

    expectIconToExist(screen, 'Classification icon', 'src', false);
  });

  it('renders correct icon for directory containing both signals and attributions', async () => {
    const resources = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: false,
        canHaveChildren: true,
        isFile: false,
        containsExternalAttribution: true,
        containsManualAttribution: true,
        containsResourcesWithOnlyExternalAttribution: true,
      }),
    ];

    await renderComponent(<ResourcesTree resources={resources} />, {
      data: defaultData,
    });

    expectResourceIconLabelToBe(screen, 'root', 'Directory icon');
  });
});

function expectIconToExist(
  screen: Screen,
  iconLabel: string,
  resourceName: string,
  expectedToExist: boolean,
): void {
  const treeItem = screen.getByText(resourceName);
  const resourceTreeRow = treeItem.parentElement?.parentElement
    ?.parentElement as HTMLElement;
  expectedToExist
    ? expect(
        within(resourceTreeRow).getByLabelText(iconLabel),
      ).toBeInTheDocument()
    : expect(
        within(resourceTreeRow).queryByLabelText(iconLabel),
      ).not.toBeInTheDocument();
}

function expectResourceIconLabelToBe(
  screen: Screen,
  resourceName: string,
  iconLabel: string,
): void {
  const treeItem = screen.getByText(resourceName);
  expect(
    within(treeItem.parentElement as HTMLElement).getByLabelText(iconLabel),
  ).toBeInTheDocument();
}
