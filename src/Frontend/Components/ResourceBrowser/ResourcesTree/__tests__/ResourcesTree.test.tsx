// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  act,
  fireEvent,
  getByLabelText,
  queryByLabelText,
  Screen,
  screen,
} from '@testing-library/react';
import { isEqual } from 'lodash';

import {
  Attributions,
  Criticality,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { ROOT_PATH } from '../../../../shared-constants';
import { setFilesWithChildren } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import { addResolvedExternalAttributions } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../../state/actions/resource-actions/load-actions';
import { getResourceIdsFromResources } from '../../../../state/helpers/resources-helpers';
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { ResourcesTree } from '../ResourcesTree';

describe('ResourcesTree', () => {
  it('renders working tree', () => {
    const resources: Resources = {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'readme.md': 1,
      },
    };

    const { store } = renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('thirdParty')).toBeInTheDocument();
    expect(screen.queryByText('src')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('root'));

    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(getSelectedResourceId(store.getState())).toBe('/root/');

    fireEvent.click(screen.getByText('src'));
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expect(getSelectedResourceId(store.getState())).toBe('/root/src/');

    fireEvent.click(screen.getByText('src'));
    expect(screen.getByText('something.js')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('collapse /root/src/'));
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('src'));
    expect(screen.getByText('something.js')).toBeInTheDocument();

    fireEvent.click(screen.getByText('root'));
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('collapse /root/'));
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(screen.queryByText('src')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('root'));
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('opens folders recursively', () => {
    const resources: Resources = {
      parentDirectory: {
        childDirectory: {
          GrandchildDirectory: {
            'package_1.tr.gz': 1,
            'package_2.tr.gz': 1,
          },
        },
      },
    };

    renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.getByText('parentDirectory')).toBeInTheDocument();
    expect(screen.queryByText('childDirectory')).not.toBeInTheDocument();
    expect(screen.queryByText('GrandchildDirectory')).not.toBeInTheDocument();
    expect(screen.queryByText('package_1.tr.gz')).not.toBeInTheDocument();
    expect(screen.queryByText('package_2.tr.gz')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('parentDirectory'));
    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.getByText('parentDirectory')).toBeInTheDocument();
    expect(screen.getByText('childDirectory')).toBeInTheDocument();
    expect(screen.getByText('GrandchildDirectory')).toBeInTheDocument();
    expect(screen.getByText('package_1.tr.gz')).toBeInTheDocument();
    expect(screen.getByText('package_2.tr.gz')).toBeInTheDocument();
  });

  it('Resource browser renders icons', () => {
    const resources: Resources = {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'readme.md': 1,
      },
    };
    const testUuid: string = faker.string.uuid();
    const testManualAttributions: Attributions = {};
    const testResourcesToManualAttributions: ResourcesToAttributions = {};
    const testExternalAttributions: Attributions = {
      [testUuid]: {
        packageName: 'jquery',
        criticality: Criticality.High,
        id: testUuid,
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/': [testUuid],
    };

    const { store } = renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
              manualAttributions: testManualAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
              externalAttributions: testExternalAttributions,
              resourcesToExternalAttributions:
                testResourcesToExternalAttributions,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expectIconToExist(screen, 'Criticality icon', 'root', false);
    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon containing signals',
    );
    expect(screen.queryByText('src')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('root'));
    expect(screen.getByText('src')).toBeInTheDocument();
    expectIconToExist(screen, 'Criticality icon', 'src', true);
    expectResourceIconLabelToBe(screen, 'src', 'Directory icon with signal');

    fireEvent.click(screen.getByText('src'));
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expectIconToExist(screen, 'Criticality icon', 'something.js', false);
    expectResourceIconLabelToBe(
      screen,
      'something.js',
      'File icon without information',
    );
    act(() => {
      store.dispatch(addResolvedExternalAttributions([testUuid]));
    });
    expectIconToExist(screen, 'Criticality icon', 'src', true);
    expectResourceIconLabelToBe(
      screen,
      'src',
      'Directory icon without information',
    );

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon without information',
    );
  });

  it('Resources are sorted in alphabetical order', () => {
    const resources: Resources = {
      'd_package.exe': 1,
      'c_package.exe': 1,
      'b_package.exe': 1,
      'a_package.exe': 1,
    };

    renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.queryByText('doesntExist')).not.toBeInTheDocument();

    const expectedSequence: Array<string> = [
      'a_package.exe',
      'b_package.exe',
      'c_package.exe',
      'd_package.exe',
    ];
    const allPackages = screen.queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
  });

  it('Resource folders are sorted before files', () => {
    const resources: Resources = {
      'a_package.exe': 1,
      'b_package.exe': 1,
      c_package_folder: {},
      d_package_folder: {},
    };

    renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.queryByText('doesntExist')).not.toBeInTheDocument();

    const expectedSequence: Array<string> = [
      'c_package_folder',
      'd_package_folder',
      'a_package.exe',
      'b_package.exe',
    ];

    const allPackages = screen.queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
  });

  it('FileWithChildren are sorted with files', () => {
    const resources: Resources = {
      'a_package.exe': 1,
      'z_package.exe': 1,
      a_package_folder: {},
      z_package_folder: {},
      'package.json': {},
    };

    renderComponent(
      <ResourcesTree resourceIds={getResourceIdsFromResources(resources)} />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
            }),
          ),
          setFilesWithChildren(new Set(['/package.json/'])),
        ],
      },
    );

    expect(screen.getByText(ROOT_PATH)).toBeInTheDocument();
    expect(screen.queryByText('doesntExist')).not.toBeInTheDocument();

    const expectedSequence: Array<string> = [
      'a_package_folder',
      'z_package_folder',
      'a_package.exe',
      'package.json',
      'z_package.exe',
    ];

    const allPackages = screen.queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
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
    ? // eslint-disable-next-line testing-library/prefer-screen-queries
      expect(getByLabelText(resourceTreeRow, iconLabel)).toBeInTheDocument()
    : expect(
        // eslint-disable-next-line testing-library/prefer-screen-queries
        queryByLabelText(resourceTreeRow, iconLabel),
      ).not.toBeInTheDocument();
}

function expectResourceIconLabelToBe(
  screen: Screen,
  resourceName: string,
  iconLabel: string,
): void {
  const treeItem = screen.getByText(resourceName);
  expect(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByLabelText(treeItem.parentElement as HTMLElement, iconLabel),
  ).toBeInTheDocument();
}
