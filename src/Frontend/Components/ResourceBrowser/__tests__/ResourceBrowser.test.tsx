// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { NIL as uuidNil } from 'uuid';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  collapseFolderByClickingOnIcon,
  expectIconToExist,
  expectResourceIconLabelToBe,
} from '../../../test-helpers/test-helpers';
import { ResourceBrowser } from '../ResourceBrowser';
import {
  setExternalData,
  setFilesWithChildren,
  setManualData,
  setResources,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/audit-view-resource-selectors';
import { getNodeIdsToExpand, isChildOfSelected } from '../renderTree';
import { isEqual } from 'lodash';
import { addResolvedExternalAttribution } from '../../../state/actions/resource-actions/audit-view-simple-actions';

describe('ResourceBrowser', () => {
  test('renders working tree', () => {
    const testResources: Resources = {
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

    const { getByText, queryByText, store } = renderComponentWithStore(
      <ResourceBrowser />
    );
    store.dispatch(setResources(testResources));

    expect(getByText('/'));
    expect(getByText('root'));
    expect(getByText('thirdParty'));
    expect(queryByText('src')).toBeNull();
    fireEvent.click(queryByText('root') as Element);

    expect(getByText('root'));
    expect(getByText('readme.md'));
    expect(queryByText('something.js')).toBeNull();
    expect(getSelectedResourceId(store.getState())).toBe('/root/');

    fireEvent.click(queryByText('src') as Element);
    expect(getByText('something.js'));
    expect(getSelectedResourceId(store.getState())).toBe('/root/src/');

    fireEvent.click(queryByText('src') as Element);
    expect(queryByText('something.js')).not.toBeNull();

    collapseFolderByClickingOnIcon(screen, '/root/src/');
    expect(queryByText('something.js')).toBeNull();

    fireEvent.click(queryByText('src') as Element);
    expect(getByText('something.js'));

    fireEvent.click(queryByText('root') as Element);
    expect(getByText('something.js'));
    expect(getByText('src'));

    collapseFolderByClickingOnIcon(screen, '/root/');
    expect(queryByText('something.js')).not.toBeTruthy();
    expect(queryByText('src')).not.toBeTruthy();

    fireEvent.click(queryByText('root') as Element);
    expect(queryByText('something.js')).not.toBeTruthy();
    expect(getByText('src'));
  });

  test('opens folders recursively', () => {
    const testResources: Resources = {
      parentDirectory: {
        childDirectory: {
          GrandchildDirectory: {
            'package_1.tr.gz': 1,
            'package_2.tr.gz': 1,
          },
        },
      },
    };

    const { getByText, queryByText, store } = renderComponentWithStore(
      <ResourceBrowser />
    );
    store.dispatch(setResources(testResources));

    expect(getByText('/'));
    expect(getByText('parentDirectory'));
    expect(queryByText('childDirectory')).not.toBeTruthy();
    expect(queryByText('GrandchildDirectory')).not.toBeTruthy();
    expect(queryByText('package_1.tr.gz')).not.toBeTruthy();
    expect(queryByText('package_2.tr.gz')).not.toBeTruthy();

    fireEvent.click(queryByText('parentDirectory') as Element);
    expect(getByText('/'));
    expect(getByText('parentDirectory'));
    expect(getByText('childDirectory'));
    expect(getByText('GrandchildDirectory'));
    expect(getByText('package_1.tr.gz'));
    expect(getByText('package_2.tr.gz'));
  });

  test('Resource browser renders icons', () => {
    const testResources: Resources = {
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
    const testUuid: string = uuidNil;
    const testManualAttributions: Attributions = {};
    const testResourcesToManualAttributions: ResourcesToAttributions = {};
    const testExternalAttributions: Attributions = {
      [testUuid]: { packageName: 'jquery' },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/': [testUuid],
    };

    const { queryByText, store } = renderComponentWithStore(
      <ResourceBrowser />
    );
    store.dispatch(setResources(testResources));
    store.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    store.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );

    expect(queryByText('/')).toBeTruthy();
    expect(queryByText('root')).toBeTruthy();
    expectIconToExist(screen, 'Signal icon', 'root', false);
    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon containing signals'
    );
    expect(queryByText('src')).toBeNull();

    fireEvent.click(queryByText('root') as Element);
    expect(queryByText('src')).toBeTruthy();
    expectIconToExist(screen, 'Signal icon', 'src', true);
    expectResourceIconLabelToBe(screen, 'src', 'Directory icon with signal');

    fireEvent.click(queryByText('src') as Element);
    expect(queryByText('something.js')).toBeTruthy();
    expectIconToExist(screen, 'Signal icon', 'something.js', false);
    expectResourceIconLabelToBe(
      screen,
      'something.js',
      'File icon without information'
    );

    store.dispatch(addResolvedExternalAttribution(testUuid));
    expectIconToExist(screen, 'Signal icon', 'src', true);
    expectResourceIconLabelToBe(
      screen,
      'src',
      'Directory icon without information'
    );

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon without information'
    );
  });

  test('Resources are sorted in alphabetical order', () => {
    const testResources: Resources = {
      'd_package.exe': 1,
      'c_package.exe': 1,
      'b_package.exe': 1,
      'a_package.exe': 1,
    };

    const { getByText, queryByText, queryAllByText, store } =
      renderComponentWithStore(<ResourceBrowser />);
    store.dispatch(setResources(testResources));

    expect(getByText('/'));
    expect(queryByText('doesntExist')).toBeNull();

    const expectedSequence: Array<string> = [
      'a_package.exe',
      'b_package.exe',
      'c_package.exe',
      'd_package.exe',
    ];
    const allPackages = queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
  });

  test('Resource folders are sorted before files', () => {
    const testResources: Resources = {
      'a_package.exe': 1,
      'b_package.exe': 1,
      c_package_folder: {},
      d_package_folder: {},
    };

    const { getByText, queryByText, queryAllByText, store } =
      renderComponentWithStore(<ResourceBrowser />);
    store.dispatch(setResources(testResources));
    expect(getByText('/'));
    expect(queryByText('doesntExist')).toBeNull();

    const expectedSequence: Array<string> = [
      'c_package_folder',
      'd_package_folder',
      'a_package.exe',
      'b_package.exe',
    ];

    const allPackages = queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
  });

  test('FileWithChildren are sorted with files', () => {
    const testResources: Resources = {
      'a_package.exe': 1,
      'z_package.exe': 1,
      a_package_folder: {},
      z_package_folder: {},
      'package.json': {},
    };

    const { getByText, queryByText, queryAllByText, store } =
      renderComponentWithStore(<ResourceBrowser />);
    store.dispatch(setResources(testResources));
    store.dispatch(setFilesWithChildren(new Set(['/package.json/'])));

    expect(getByText('/'));
    expect(queryByText('doesntExist')).toBeNull();

    const expectedSequence: Array<string> = [
      'a_package_folder',
      'z_package_folder',
      'a_package.exe',
      'package.json',
      'z_package.exe',
    ];

    const allPackages = queryAllByText(/package/);
    const actualSequence = allPackages.map((p) => {
      if (p.firstChild) {
        return p.firstChild.textContent;
      }
      return null;
    });
    expect(isEqual(actualSequence, expectedSequence)).toBeTruthy();
  });
});

describe('renderTree', () => {
  test('isChildOfSelected works as expected', () => {
    const NodeId = '/adapters/';
    const firstChildNodeId = '/adapters/.settings/org';
    const secondChildNodeId = '/adapters/.settings/';
    const firstNotChild = '/release.sh';
    const secondNotChild = '/adapters/';
    expect(isChildOfSelected(firstChildNodeId, NodeId)).toBe(true);
    expect(isChildOfSelected(secondChildNodeId, NodeId)).toBe(true);
    expect(isChildOfSelected(firstNotChild, NodeId)).toBe(false);
    expect(isChildOfSelected(secondNotChild, NodeId)).toBe(false);
  });

  test('getNodeIdsToExpand returns correct nodeIds', () => {
    const nodeId = '/parent/';
    const resource: Resources | 1 = {
      directory: {
        subdirectory: { 'something.js': 1 },
      },
    };
    const expectedNodeIdsToExpand: Array<string> = [
      '/parent/',
      '/parent/directory/',
      '/parent/directory/subdirectory/',
    ];

    expect(getNodeIdsToExpand(nodeId, resource)).toEqual(
      expectedNodeIdsToExpand
    );
  });
});
