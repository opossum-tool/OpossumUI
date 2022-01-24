// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { ResourceDetailsViewer } from '../ResourceDetailsViewer';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  setExternalData,
  setTemporaryPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getDisplayedPackage } from '../../../state/selectors/audit-view-resource-selectors';
import {
  expectValueInTextBox,
  expectValueNotInTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnTab } from '../../../test-helpers/package-panel-helpers';

jest.mock('../../ResourceDetailsTabs/get-new-accordion-worker');

const testExternalLicense = 'Computed attribution license.';
const testExternalLicense2 = 'Other computed attribution license.';
const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryPackageInfo: PackageInfo = {
  packageName: 'jQuery',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
};
const testTemporaryPackageInfo2: PackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
};

function getTestTemporaryAndExternalStateWithParentAttribution(
  store: EnhancedTestStore,
  selectedResourceId: string,
  temporaryPackageInfo: PackageInfo
): void {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryPackageInfo,
    uuid_2: testTemporaryPackageInfo2,
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/test_parent': ['uuid_1'],
    '/test_parent/test_child_with_own_attr': ['uuid_2'],
  };

  store.dispatch(
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resourcesToManualAttributions,
      })
    )
  );
  store.dispatch(setSelectedResourceId(selectedResourceId));
  store.dispatch(setTemporaryPackageInfo(temporaryPackageInfo));
}

let originalIpcRenderer: IpcRenderer;

describe('The ResourceDetailsViewer', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders an Attribution column', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      packageName: 'jQuery',
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(setSelectedResourceId('test_id'));
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(screen.queryAllByText('Name'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.packageName as string)
    );
  });

  test(
    'preselects the first manual attribution and the first manual attribution from parent correctly, ' +
      'despite the alphabetical ordering',
    () => {
      const testManualAttributions: Attributions = {
        alphabetically_first: {
          packageName: 'aaaaa',
          licenseName: 'MIT',
        },
        alphabetically_second: {
          packageName: 'bbbbb',
          licenseName: 'MIT',
        },
      };
      const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { '/': { file: 1 } },
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: {
              '/': ['alphabetically_second', 'alphabetically_first'],
            },
          })
        )
      );

      store.dispatch(setSelectedResourceId('/'));
      expect(screen.queryAllByText('MIT')[0].parentElement).toHaveTextContent(
        'aaaaa'
      );
      expect(getDisplayedPackage(store.getState())).toEqual({
        attributionId: 'alphabetically_first',
        panel: 'Attributions',
      });

      store.dispatch(setSelectedResourceId('/file'));
      expect(screen.queryAllByText('MIT')[0].parentElement).toHaveTextContent(
        'aaaaa'
      );
      expect(getDisplayedPackage(store.getState())).toEqual({
        attributionId: 'alphabetically_first',
        panel: 'Attributions',
      });
    }
  );

  test('renders a ExternalPackageCard', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(setSelectedResourceId('/test_id'));
    const externalAttributions: Attributions = {
      uuid_1: {
        source: { name: 'HC', documentConfidence: -1 },
        packageName: 'JQuery',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };

    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions,
          resourcesToExternalAttributions,
        })
      )
    );
    store.dispatch(
      setExternalData(externalAttributions, resourcesToExternalAttributions)
    );
    store.dispatch(setTemporaryPackageInfo({}));

    expect(screen.getByText('Signals'));
    expect(screen.getByText('JQuery'));
  });

  test('renders Contained External Packages', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    const externalAttributions: Attributions = {
      uuid_2: {
        packageName: 'JQuery',
        packageVersion: '1.0',
      },
      uuid_1: {
        packageName: 'Another Package',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
      '/test_id/subdirectory': ['uuid_2'],
    };
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions,
          resourcesToExternalAttributions,
        })
      )
    );

    store.dispatch(setSelectedResourceId('/test_id/'));
    store.dispatch(setTemporaryPackageInfo({}));

    expect(screen.getByText('Signals in Folder Content'));
    expect(screen.getByText('JQuery, 1.0'));
  });

  test('selects an external package and a manual package, showing the right info', () => {
    const manualAttributions = {
      uuid_1: testTemporaryPackageInfo,
    };
    const resourcesToManualAttributions = { '/test_id': ['uuid_1'] };
    const externalAttributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'React',
        licenseText: testExternalLicense,
      },
    };
    const resourcesToExternalAttributions = { '/test_id': ['uuid_2'] };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(setSelectedResourceId('/test_id'));
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { a: { b: 1 } },
          manualAttributions,
          resourcesToManualAttributions,
          externalAttributions,
          resourcesToExternalAttributions,
        })
      )
    );

    fireEvent.click(screen.getByText('jQuery, 16.5.0') as Element);
    expect(screen.getByDisplayValue('jQuery'));
    expect(screen.getByDisplayValue('16.5.0'));
    expect(screen.getByText('React'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );

    fireEvent.click(screen.getByText('React') as Element);
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );
    expect(
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('jQuery, 16.5.0') as Element);
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('adds an external package to a manual package', () => {
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };
    const externalAttributions: Attributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'JQuery',
        licenseText: testExternalLicense,
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_2'],
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(setSelectedResourceId('/test_id'));
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { a: { b: 1 } },
          manualAttributions,
          resourcesToManualAttributions,
          externalAttributions,
          resourcesToExternalAttributions,
        })
      )
    );

    fireEvent.click(screen.getByText('jQuery, 16.5.0') as Element);
    expect(screen.getByText('JQuery'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );

    fireEvent.click(screen.getByText('JQuery') as Element);
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );

    fireEvent.click(screen.getByText('jQuery, 16.5.0') as Element);
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );

    fireEvent.click(screen.getByLabelText('add JQuery') as Element);
    fireEvent.click(screen.getByText('Attributions') as Element);
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );
  });

  test('selects the manual package view after you added an external package', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);

    const manualAttributions: Attributions = {
      uuid_1: testTemporaryPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };
    const externalAttributions: Attributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: -1 },
        packageName: 'JQuery',
        licenseText: testExternalLicense,
      },
      uuid_3: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'Other package',
        licenseText: testExternalLicense2,
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_2', 'uuid_3'],
    };

    store.dispatch(setSelectedResourceId('/test_id'));
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { a: { b: 1 } },
          manualAttributions,
          resourcesToManualAttributions,
          externalAttributions,
          resourcesToExternalAttributions,
        })
      )
    );

    fireEvent.click(screen.getByText('Other package') as Element);
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2
    );

    fireEvent.click(screen.getByLabelText('add JQuery') as Element);
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2
    );
  });

  test('shows parent attribution if child has no other attribution', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child',
      testTemporaryPackageInfo
    );

    expect(screen.getByDisplayValue('jQuery'));
    expect(screen.getByDisplayValue('16.5.0'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense
    );
  });

  test('does not show parent attribution if child has another attribution', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child_with_own_attr',
      testTemporaryPackageInfo2
    );

    expect(screen.getByDisplayValue('Vue.js'));
    expect(screen.getByDisplayValue('2.6.11'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense2
    );
  });

  test('shows enabled add to package tab if assignable packages are present', () => {
    const testResources: Resources = {
      root: {
        fileWithoutAttribution: 1,
      },
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      fileWithoutAttribution: ['uuid_1'],
    };
    const manualPackagePanelLabel = `${testTemporaryPackageInfo.packageName}, ${testTemporaryPackageInfo.packageVersion}`;
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions,
          resourcesToManualAttributions,
        })
      )
    );

    store.dispatch(setSelectedResourceId('/root/'));
    expect(screen.getByText('Signals'));
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();

    clickOnTab(screen, 'All Attributions Tab');
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();
    expect(screen.getByText(manualPackagePanelLabel));

    clickOnTab(screen, 'Signals & Content Tab');
    expect(screen.getByText('Signals'));
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();
  });

  test('shows disabled add to package tab if no assignable package is present', () => {
    const testResources: Resources = {
      fileWithAttribution: 1,
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/fileWithAttribution': ['uuid_1'],
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions,
          resourcesToManualAttributions,
        })
      )
    );

    store.dispatch(setSelectedResourceId('/fileWithAttribution'));
    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'All Attributions Tab');
    expect(screen.getByText('Signals'));
  });

  test('shows disabled add to package tab if override parent has not been clicked', () => {
    const testResources: Resources = {
      folderWithAttribution: { childrenFile: 1 },
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryPackageInfo,
      uuid_2: testTemporaryPackageInfo2,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/folderWithAttribution/': ['uuid_1'],
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions,
          resourcesToManualAttributions,
        })
      )
    );

    store.dispatch(
      setSelectedResourceId('/folderWithAttribution/childrenFile')
    );
    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'All Attributions Tab');
    expect(screen.getByText('Signals'));
  });

  test('hides the package info for attribution breakpoints unless a signal is selected', () => {
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);

    const manualAttributions: Attributions = {};
    const resourcesToManualAttributions: ResourcesToAttributions = {};
    const externalAttributions: Attributions = {
      uuid_3: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'Other package',
        licenseText: testExternalLicense2,
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_3'],
    };

    store.dispatch(setSelectedResourceId('/test_id'));
    store.dispatch(
      loadFromFile({
        ...getParsedInputFileEnrichedWithTestData({
          resources: { a: { b: 1 } },
          manualAttributions,
          resourcesToManualAttributions,
          externalAttributions,
          resourcesToExternalAttributions,
        }),
        attributionBreakpoints: new Set(['/test_id']),
      })
    );

    expect(screen.queryByText('Attributions')).not.toBeInTheDocument();
    expect(screen.queryByText('Add new attribution')).not.toBeInTheDocument();
    expect(screen.queryByText('1st party')).not.toBeInTheDocument();
    expect(
      screen.queryByText('License Text (to appear in attribution document)')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Other package') as Element);
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2
    );
  });
});
