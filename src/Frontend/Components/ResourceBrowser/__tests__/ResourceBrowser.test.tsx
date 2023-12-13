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
import { NIL as uuidNil } from 'uuid';

import {
  Attributions,
  Criticality,
  Resources,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import { PopupType } from '../../../enums/enums';
import {
  setExternalData,
  setFilesWithChildren,
  setManualData,
  setResources,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { addResolvedExternalAttribution } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { setLocatePopupFilters } from '../../../state/actions/resource-actions/locate-popup-actions';
import { getSelectedResourceId } from '../../../state/selectors/audit-view-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { collapseFolderByClickingOnIcon } from '../../../test-helpers/resource-browser-test-helpers';
import { ResourceBrowser } from '../ResourceBrowser';

describe('ResourceBrowser', () => {
  it('renders working tree', () => {
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

    const { store } = renderComponent(<ResourceBrowser />, {
      actions: [setResources(testResources)],
    });

    expect(
      screen.queryByLabelText('locate attributions'),
    ).not.toBeInTheDocument();

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('thirdParty')).toBeInTheDocument();
    expect(screen.queryByText('src')).not.toBeInTheDocument();
    fireEvent.click(screen.queryByText('root') as Element);

    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(getSelectedResourceId(store.getState())).toBe('/root/');

    fireEvent.click(screen.queryByText('src') as Element);
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expect(getSelectedResourceId(store.getState())).toBe('/root/src/');

    fireEvent.click(screen.queryByText('src') as Element);
    expect(screen.getByText('something.js')).toBeInTheDocument();

    collapseFolderByClickingOnIcon(screen, '/root/src/');
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();

    fireEvent.click(screen.queryByText('src') as Element);
    expect(screen.getByText('something.js')).toBeInTheDocument();

    fireEvent.click(screen.queryByText('root') as Element);
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();

    collapseFolderByClickingOnIcon(screen, '/root/');
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(screen.queryByText('src')).not.toBeInTheDocument();

    fireEvent.click(screen.queryByText('root') as Element);
    expect(screen.queryByText('something.js')).not.toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('opens folders recursively', () => {
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

    renderComponent(<ResourceBrowser />, {
      actions: [setResources(testResources)],
    });

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('parentDirectory')).toBeInTheDocument();
    expect(screen.queryByText('childDirectory')).not.toBeInTheDocument();
    expect(screen.queryByText('GrandchildDirectory')).not.toBeInTheDocument();
    expect(screen.queryByText('package_1.tr.gz')).not.toBeInTheDocument();
    expect(screen.queryByText('package_2.tr.gz')).not.toBeInTheDocument();

    fireEvent.click(screen.queryByText('parentDirectory') as Element);
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('parentDirectory')).toBeInTheDocument();
    expect(screen.getByText('childDirectory')).toBeInTheDocument();
    expect(screen.getByText('GrandchildDirectory')).toBeInTheDocument();
    expect(screen.getByText('package_1.tr.gz')).toBeInTheDocument();
    expect(screen.getByText('package_2.tr.gz')).toBeInTheDocument();
  });

  it('Resource browser renders icons', () => {
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
      [testUuid]: { packageName: 'jquery', criticality: Criticality.High },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/': [testUuid],
    };

    const testLocatePopupSelectedCriticality = SelectedCriticality.High;

    const { store } = renderComponent(<ResourceBrowser />, {
      actions: [
        setResources(testResources),
        setManualData(
          testManualAttributions,
          testResourcesToManualAttributions,
        ),
        setExternalData(
          testExternalAttributions,
          testResourcesToExternalAttributions,
        ),
        setLocatePopupFilters({
          selectedCriticality: testLocatePopupSelectedCriticality,
          selectedLicenses: new Set<string>(),
          searchTerm: '',
          searchOnlyLicenseName: false,
        }),
      ],
    });

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expectIconToExist(screen, 'Signal icon', 'root', false);
    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon containing signals',
    );
    expectIconToExist(screen, 'located attribution', '/', false);
    expectIconToExist(screen, 'located attribution', 'root', true);
    expect(screen.queryByText('src')).not.toBeInTheDocument();

    fireEvent.click(screen.queryByText('root') as Element);
    expect(screen.getByText('src')).toBeInTheDocument();
    expectIconToExist(screen, 'Signal icon', 'src', true);
    expectResourceIconLabelToBe(screen, 'src', 'Directory icon with signal');
    expectIconToExist(screen, 'located attribution', 'root', false);
    expectIconToExist(screen, 'located attribution', 'src', true);

    fireEvent.click(screen.queryByText('src') as Element);
    expect(screen.getByText('something.js')).toBeInTheDocument();
    expectIconToExist(screen, 'Signal icon', 'something.js', false);
    expectResourceIconLabelToBe(
      screen,
      'something.js',
      'File icon without information',
    );
    act(() => {
      store.dispatch(addResolvedExternalAttribution(testUuid));
    });
    expectIconToExist(screen, 'Signal icon', 'src', true);
    expectResourceIconLabelToBe(
      screen,
      'src',
      'Directory icon without information',
    );
    expectIconToExist(screen, 'located attribution', 'src', true);
    expectIconToExist(screen, 'located attribution', 'something.js', false);

    expectResourceIconLabelToBe(
      screen,
      'root',
      'Directory icon without information',
    );
  });

  it('Resources are sorted in alphabetical order', () => {
    const testResources: Resources = {
      'd_package.exe': 1,
      'c_package.exe': 1,
      'b_package.exe': 1,
      'a_package.exe': 1,
    };

    renderComponent(<ResourceBrowser />, {
      actions: [setResources(testResources)],
    });

    expect(screen.getByText('/')).toBeInTheDocument();
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
    const testResources: Resources = {
      'a_package.exe': 1,
      'b_package.exe': 1,
      c_package_folder: {},
      d_package_folder: {},
    };

    renderComponent(<ResourceBrowser />, {
      actions: [setResources(testResources)],
    });
    expect(screen.getByText('/')).toBeInTheDocument();
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
    const testResources: Resources = {
      'a_package.exe': 1,
      'z_package.exe': 1,
      a_package_folder: {},
      z_package_folder: {},
      'package.json': {},
    };

    renderComponent(<ResourceBrowser />, {
      actions: [
        setResources(testResources),
        setFilesWithChildren(new Set(['/package.json/'])),
      ],
    });

    expect(screen.getByText('/')).toBeInTheDocument();
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

  it('renders working tree with the locate attributions icon', () => {
    const { store } = renderComponent(<ResourceBrowser />, {
      actions: [
        setResources({}),
        setLocatePopupFilters({
          selectedCriticality: SelectedCriticality.High,
          selectedLicenses: new Set<string>(),
          searchTerm: '',
          searchOnlyLicenseName: false,
        }),
      ],
    });

    expect(screen.getByLabelText('locate active')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('locate active'));

    expect(getOpenPopup(store.getState())).toBe(PopupType.LocatorPopup);
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
