// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../../shared-constants';
import {
  setExternalData,
  setTemporaryDisplayPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getDisplayedPackage } from '../../../state/selectors/all-views-resource-selectors';
import {
  expectValueInTextBox,
  expectValueNotInTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  getAttributionsToResources,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { PanelPackage } from '../../../types/types';
import { ResourceDetailsViewer } from '../ResourceDetailsViewer';

const testExternalLicense = 'Computed attribution license.';
const testExternalLicense2 = 'Other computed attribution license.';
const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryDisplayPackageInfo: PackageInfo = {
  packageName: 'jQuery',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
  id: 'uuid_1',
};
const testTemporaryDisplayPackageInfo2: PackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
  id: 'uuid_2',
};

function getActions(
  selectedResourceId: string,
  temporaryDisplayPackageInfo: PackageInfo,
) {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryDisplayPackageInfo,
    uuid_2: testTemporaryDisplayPackageInfo2,
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/test_parent': ['uuid_1'],
    '/test_parent/test_child_with_own_attr': ['uuid_2'],
  };

  return [
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resourcesToManualAttributions,
      }),
    ),
    setSelectedResourceId(selectedResourceId),
    setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
  ];
}

describe('The ResourceDetailsViewer', () => {
  it('renders an Attribution column', () => {
    const testTemporaryDisplayPackageInfo = {
      packageName: 'jQuery',
      id: 'uuid_1',
    } satisfies PackageInfo;
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('test_id'),
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      ],
    });

    expect(
      screen.getByLabelText(text.attributionColumn.packageSubPanel.packageName),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageName),
    ).toBeInTheDocument();
  });

  it(
    'preselects the first manual attribution and the first manual attribution from parent correctly, ' +
      'despite the alphabetical ordering',
    () => {
      const testManualAttributions: Attributions = {
        alphabetically_first: {
          packageName: 'aaaaa',
          licenseName: 'MIT',
          id: 'alphabetically_first',
        },
        alphabetically_second: {
          packageName: 'bbbbb',
          licenseName: 'MIT',
          id: 'alphabetically_second',
        },
      };
      const expectedPanelPackage: PanelPackage = {
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: 'alphabetically_first',
        displayPackageInfo: {
          packageName: 'aaaaa',
          licenseName: 'MIT',
          id: 'alphabetically_first',
        },
      };
      const { store } = renderComponent(<ResourceDetailsViewer />, {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: { '/': { file: 1 } },
              manualAttributions: testManualAttributions,
              resourcesToManualAttributions: {
                '/': ['alphabetically_second', 'alphabetically_first'],
              },
            }),
          ),
          setSelectedResourceId('/'),
        ],
      });

      expect(screen.queryAllByText('MIT')[0].parentElement).toHaveTextContent(
        'aaaaa',
      );
      expect(getDisplayedPackage(store.getState())).toEqual(
        expectedPanelPackage,
      );

      act(() => {
        store.dispatch(setSelectedResourceId('/file'));
      });
      expect(screen.queryAllByText('MIT')[0].parentElement).toHaveTextContent(
        'aaaaa',
      );
      expect(getDisplayedPackage(store.getState())).toEqual(
        expectedPanelPackage,
      );
    },
  );

  it('renders a ExternalPackageCard', () => {
    const externalAttributions: Attributions = {
      uuid_1: {
        source: { name: 'HC', documentConfidence: -1 },
        packageName: 'JQuery',
        id: 'uuid_1',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };
    const externalAttributionsToResources = getAttributionsToResources(
      resourcesToExternalAttributions,
    );

    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('/test_id'),
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            externalAttributions,
            resourcesToExternalAttributions,
          }),
        ),
        setExternalData(
          externalAttributions,
          resourcesToExternalAttributions,
          externalAttributionsToResources,
        ),
        setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO),
      ],
    });

    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.getByText('JQuery')).toBeInTheDocument();
  });

  it('selects an external package and a manual package, showing the right info', () => {
    const manualAttributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
    };
    const resourcesToManualAttributions = { '/test_id': ['uuid_1'] };
    const externalAttributions: Attributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'React',
        licenseText: testExternalLicense,
        id: 'uuid_2',
      },
    };
    const resourcesToExternalAttributions = { '/test_id': ['uuid_2'] };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('/test_id'),
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { a: { b: 1 } },
            manualAttributions,
            resourcesToManualAttributions,
            externalAttributions,
            resourcesToExternalAttributions,
          }),
        ),
      ],
    });

    fireEvent.click(screen.getByText('jQuery, 16.5.0'));
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16.5.0')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );

    fireEvent.click(screen.getByText('React'));
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('jQuery, 16.5.0'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('adds an external package to a manual package', () => {
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };
    const externalAttributions: Attributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: 1 },
        packageName: 'JQuery',
        licenseText: testExternalLicense,
        id: 'uuid_2',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_2'],
    };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('/test_id'),
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { a: { b: 1 } },
            manualAttributions,
            resourcesToManualAttributions,
            externalAttributions,
            resourcesToExternalAttributions,
          }),
        ),
      ],
    });

    fireEvent.click(screen.getByText('jQuery, 16.5.0'));
    expect(screen.getByText('JQuery')).toBeInTheDocument();
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );

    fireEvent.click(screen.getByText('JQuery'));
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );

    fireEvent.click(screen.getByText('jQuery, 16.5.0'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );

    fireEvent.click(screen.getByLabelText('add JQuery'));
    fireEvent.click(screen.getByText('Attributions'));
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );
  });

  // eslint-disable-next-line jest/expect-expect
  it('selects the manual package view after you added an external package', () => {
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_1'],
    };
    const externalAttributions: Attributions = {
      uuid_2: {
        source: { name: 'HC', documentConfidence: -1 },
        packageName: 'JQuery',
        licenseText: testExternalLicense,
        id: 'uuid_2',
      },
      uuid_3: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'Other package',
        licenseText: testExternalLicense2,
        id: 'uuid_3',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_2', 'uuid_3'],
    };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('/test_id'),
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { a: { b: 1 } },
            manualAttributions,
            resourcesToManualAttributions,
            externalAttributions,
            resourcesToExternalAttributions,
          }),
        ),
      ],
    });

    fireEvent.click(screen.getByText('Other package'));
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2,
    );

    fireEvent.click(screen.getByLabelText('add JQuery'));
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense,
    );
    expectValueNotInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2,
    );
  });

  it('shows parent attribution if child has no other attribution', () => {
    renderComponent(<ResourceDetailsViewer />, {
      actions: getActions(
        '/test_parent/test_child',
        testTemporaryDisplayPackageInfo,
      ),
    });

    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16.5.0')).toBeInTheDocument();
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense,
    );
  });

  it('does not show parent attribution if child has another attribution', () => {
    renderComponent(<ResourceDetailsViewer />, {
      actions: getActions(
        '/test_parent/test_child_with_own_attr',
        testTemporaryDisplayPackageInfo2,
      ),
    });

    expect(screen.getByDisplayValue('Vue.js')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.6.11')).toBeInTheDocument();
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testManualLicense2,
    );
  });

  it('shows enabled add to package tab if assignable packages are present', async () => {
    const testResources: Resources = {
      root: {
        fileWithoutAttribution: 1,
      },
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      fileWithoutAttribution: ['uuid_1'],
    };
    const manualPackagePanelLabel = `${testTemporaryDisplayPackageInfo.packageName}, ${testTemporaryDisplayPackageInfo.packageVersion}`;
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions,
            resourcesToManualAttributions,
          }),
        ),
        setSelectedResourceId('/root/'),
      ],
    });
    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Global Tab'));
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();
    expect(screen.getByText(manualPackagePanelLabel)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Local Tab'));
    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.queryByText(manualPackagePanelLabel)).not.toBeInTheDocument();
  });

  it('shows disabled add to package tab if no assignable package is present', () => {
    const testResources: Resources = {
      fileWithAttribution: 1,
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/fileWithAttribution': ['uuid_1'],
    };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions,
            resourcesToManualAttributions,
          }),
        ),
        setSelectedResourceId('/fileWithAttribution'),
      ],
    });
    expect(screen.getByText('Signals')).toBeInTheDocument();

    expect(screen.getByLabelText('Global Tab')).toBeDisabled();
  });

  it('shows disabled add to package tab if override parent has not been clicked', () => {
    const testResources: Resources = {
      folderWithAttribution: { childrenFile: 1 },
    };
    const manualAttributions: Attributions = {
      uuid_1: testTemporaryDisplayPackageInfo,
      uuid_2: testTemporaryDisplayPackageInfo2,
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/folderWithAttribution/': ['uuid_1'],
    };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions,
            resourcesToManualAttributions,
          }),
        ),
        setSelectedResourceId('/folderWithAttribution/childrenFile'),
      ],
    });

    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.getByLabelText('Global Tab')).toBeDisabled();
  });

  it('hides the package info for attribution breakpoints unless a signal is selected', () => {
    const manualAttributions: Attributions = {};
    const resourcesToManualAttributions: ResourcesToAttributions = {};
    const externalAttributions: Attributions = {
      uuid_3: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'Other package',
        licenseText: testExternalLicense2,
        id: 'uuid_3',
      },
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/test_id': ['uuid_3'],
    };
    renderComponent(<ResourceDetailsViewer />, {
      actions: [
        setSelectedResourceId('/test_id'),
        loadFromFile({
          ...getParsedInputFileEnrichedWithTestData({
            resources: { a: { b: 1 } },
            manualAttributions,
            resourcesToManualAttributions,
            externalAttributions,
            resourcesToExternalAttributions,
          }),
          attributionBreakpoints: new Set(['/test_id']),
        }),
      ],
    });

    expect(screen.queryByText('Attributions')).not.toBeInTheDocument();
    expect(
      screen.queryByText(ADD_NEW_ATTRIBUTION_BUTTON_TEXT),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('1st party')).not.toBeInTheDocument();
    expect(
      screen.queryByText('License Text (to appear in attribution document)'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Other package'));
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      testExternalLicense2,
    );
  });
});
