// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  DisplayPackageInfo,
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
import { act } from 'react-dom/test-utils';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../../shared-constants';

const testExternalLicense = 'Computed attribution license.';
const testExternalLicense2 = 'Other computed attribution license.';
const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryPackageInfo: DisplayPackageInfo = {
  packageName: 'jQuery',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
  attributionIds: [],
};
const testTemporaryPackageInfo2: DisplayPackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
  attributionIds: [],
};

function getTestTemporaryAndExternalStateWithParentAttribution(
  store: EnhancedTestStore,
  selectedResourceId: string,
  temporaryPackageInfo: DisplayPackageInfo
): void {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryPackageInfo,
    uuid_2: testTemporaryPackageInfo2,
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/test_parent': ['uuid_1'],
    '/test_parent/test_child_with_own_attr': ['uuid_2'],
  };
  act(() => {
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
  });
}

describe('The ResourceDetailsViewer', () => {
  it('renders an Attribution column', () => {
    const testTemporaryPackageInfo: DisplayPackageInfo = {
      packageName: 'jQuery',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(screen.queryAllByText('Name'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.packageName as string)
    );
  });

  it(
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
      act(() => {
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
      });

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

  it('renders a ExternalPackageCard', () => {
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
    act(() => {
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
      store.dispatch(setTemporaryPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO));
    });

    expect(screen.getByText('Signals'));
    expect(screen.getByText('JQuery'));
  });

  it('renders Contained External Packages', () => {
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
      '/test_id/': ['uuid_1'],
      '/test_id/subdirectory': ['uuid_2'],
    };
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { test_id: { subdirectory: 1 } },
            externalAttributions,
            resourcesToExternalAttributions,
          })
        )
      );
      store.dispatch(setSelectedResourceId('/test_id/'));
      store.dispatch(setTemporaryPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO));
    });

    expect(screen.getByText('Signals in Folder Content'));
    expect(screen.getByText('JQuery, 1.0'));
  });

  it('selects an external package and a manual package, showing the right info', () => {
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
    act(() => {
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
    });

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

  it('selects a merged external package, showing the right info', () => {
    const externalAttributions = {
      uuid_1: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'React',
        copyright: 'Meta 2022',
        attributionConfidence: 50,
        comment: 'Comment 1',
      },
      uuid_2: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'React',
        copyright: 'Meta 2022',
        attributionConfidence: 40,
        comment: 'Comment 2',
      },
    };
    const resourcesToExternalAttributions = {
      '/test_id': ['uuid_1', 'uuid_2'],
    };
    const { store } = renderComponentWithStore(<ResourceDetailsViewer />);
    act(() => {
      store.dispatch(setSelectedResourceId('/test_id'));
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { a: { b: 1 } },
            externalAttributions,
            resourcesToExternalAttributions,
          })
        )
      );
    });

    expect(screen.getByText('React'));
    fireEvent.click(screen.getByText('React') as Element);

    expect(screen.getByDisplayValue('Comment 1'));
    expect(screen.getByDisplayValue('Comment 2'));
    expect(screen.getByDisplayValue('40'));
    expect(
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
  });

  it('adds an external package to a manual package', () => {
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
    act(() => {
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
    });

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

  it('selects the manual package view after you added an external package', () => {
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
    act(() => {
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
    });

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

  it('shows parent attribution if child has no other attribution', () => {
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

  it('does not show parent attribution if child has another attribution', () => {
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

  it('shows enabled add to package tab if assignable packages are present', () => {
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
    act(() => {
      store.dispatch(setSelectedResourceId('/root/'));
    });
    expect(screen.getByText('Signals'));
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();

    clickOnTab(screen, 'Global Tab');
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();
    expect(screen.getByText(manualPackagePanelLabel));

    clickOnTab(screen, 'Local Tab');
    expect(screen.getByText('Signals'));
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();
  });

  it('shows disabled add to package tab if no assignable package is present', () => {
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
    act(() => {
      store.dispatch(setSelectedResourceId('/fileWithAttribution'));
    });
    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'Global Tab');
    expect(screen.getByText('Signals'));
  });

  it('shows disabled add to package tab if override parent has not been clicked', () => {
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
    act(() => {
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
    });

    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'Global Tab');
    expect(screen.getByText('Signals'));
  });

  it('hides the package info for attribution breakpoints unless a signal is selected', () => {
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
    act(() => {
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
    });

    expect(screen.queryByText('Attributions')).not.toBeInTheDocument();
    expect(
      screen.queryByText(ADD_NEW_ATTRIBUTION_BUTTON_TEXT)
    ).not.toBeInTheDocument();
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
