// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { App } from '../../../Components/App/App';
import { ButtonText, PackagePanelTitle, View } from '../../../enums/enums';
import { setQAMode } from '../../../state/actions/view-actions/view-actions';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clearPopover } from '../../../test-helpers/context-menu-test-helpers';
import {
  clickOnButton,
  clickOnTopProgressBar,
  closeProjectStatisticsPopup,
  EMPTY_PARSED_FILE_CONTENT,
  expectAttributionIsMarkedAsWasPreferred,
  expectNoAttributionIsMarkedAsWasPreferred,
  getButton,
  getOpenFileIcon,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  clickAddIconOnCardInAttributionList,
  clickOnPackageInPackagePanel,
  clickOnValueInManualPackagePanelForParentAttribution,
  expectAddIconInAddToAttributionCardIsHidden,
  expectAddIconInAddToAttributionCardIsNotHidden,
  expectPackageInPackagePanel,
  expectPackageNotInPackagePanel,
  expectPackagePanelNotShown,
  expectPackagePanelShown,
  expectValueInManualPackagePanel,
  expectValueInManualPackagePanelForParentAttribution,
  expectValueNotInManualPackagePanel,
} from '../../../test-helpers/package-panel-helpers';
import {
  expectModifyWasPreferredPopupIsShown,
  expectReplaceAttributionPopupIsNotShown,
  expectReplaceAttributionPopupIsShown,
  expectUnsavedChangesPopupIsShown,
} from '../../../test-helpers/popup-test-helpers';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
  getElementInResourceBrowser,
} from '../../../test-helpers/resource-browser-test-helpers';

describe('The App in Audit View', () => {
  it('renders TopBar and no ResourceBrowser when no resource file has been loaded', () => {
    renderComponentWithStore(<App />);

    expectResourceBrowserIsNotShown(screen);
    expect(getOpenFileIcon(screen));
  });

  it('allows to modify text in text boxes', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'something.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'something.js');
    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );

    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageVersion,
      '16.5.1',
    );
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageVersion,
      '16.5.1',
    );

    insertValueIntoTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'new license',
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'new license',
    );
  });

  it('shows aggregated and parent attributions correctly', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_2: 1 } },
        file: 1,
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_1: { packageName: 'React' },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 99.0,
            },
            packageName: 'JQuery',
          },
        },
        resourcesToAttributions: {
          '/root/src/': ['uuid_1'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    getElementInResourceBrowser(screen, 'root');
    expectPackagePanelNotShown(screen, 'Signals in Folder Content');
    expectPackagePanelNotShown(screen, 'Attributions in Folder Content');
    expectPackagePanelNotShown(screen, 'Signals');

    clickOnElementInResourceBrowser(screen, 'root');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals in Folder Content');

    clickOnElementInResourceBrowser(screen, 'src');
    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');

    clickOnElementInResourceBrowser(screen, 'directory_manual');
    expectPackageInPackagePanel(
      screen,
      'React',
      'Attributions in Folder Content',
    );
    clickOnElementInResourceBrowser(screen, 'subdirectory_manual');
    expectValueInManualPackagePanel(screen, 'React');

    clickOnElementInResourceBrowser(screen, 'file_manual');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectValueInManualPackagePanelForParentAttribution(screen, 'React');
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    clickOnValueInManualPackagePanelForParentAttribution(screen, 'React');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    clearPopover(screen);
    clickOnButton(screen, 'Override parent');
    expectValueNotInManualPackagePanel(screen, 'React');
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Angular',
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Angular',
    );
  });

  it('show confidence correctly', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'withExternalAttribution.js': 1,
        'withoutAttribution.js': 1,
        'withManualAttribution.js': 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            attributionConfidence: DiscreteConfidence.High,
            packageName: 'Vue',
          },
        },
        resourcesToAttributions: {
          '/withManualAttribution.js': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_2: {
            attributionConfidence: 10,
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
            comment: 'React comment',
          },
        },
        resourcesToAttributions: {
          '/withExternalAttribution.js': ['uuid_2'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'withExternalAttribution.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);

    clickOnPackageInPackagePanel(screen, 'React, 16.5.0', 'Signals');
    expect(screen.queryAllByDisplayValue('10').length).toEqual(1);
    expectValueNotInConfidenceField(
      screen,
      `High (${DiscreteConfidence.High})`,
    );

    clickAddIconOnCardInAttributionList(screen, 'React, 16.5.0');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectValueInTextBox(screen, 'Comment', 'React comment');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    clickOnButton(screen, ButtonText.Save);

    clickOnElementInResourceBrowser(screen, 'withManualAttribution.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);

    clickOnElementInResourceBrowser(screen, 'withoutAttribution.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
  });

  it('allows to switch between resources by clicking the progress bar', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { folder2: { file1: 1 } },
        file2: 1,
        folder3: { folder4: { file3: 1 } },
      },
      manualAttributions: {
        attributions: {},
        resourcesToAttributions: {},
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 50.0,
            },
            packageName: 'JQuery',
          },
          uuid_2: {
            source: {
              name: 'SC',
              documentConfidence: 9.0,
            },
            packageName: 'React',
          },
          uuid_3: {
            source: {
              name: 'HHC',
              documentConfidence: 80.0,
            },
            packageName: 'Vue',
          },
        },
        resourcesToAttributions: {
          '/folder1/folder2/file1': ['uuid_1'],
          '/file2': ['uuid_2'],
          '/folder3/folder4/file3': ['uuid_3'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);

    renderComponentWithStore(<App />);

    clickOnTopProgressBar(screen);
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'JQuery');

    clickOnElementInResourceBrowser(screen, 'folder3');
    clickOnElementInResourceBrowser(screen, 'folder4');
    clickOnElementInResourceBrowser(screen, 'file3');

    expectPackageInPackagePanel(screen, 'Vue', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'Vue');

    clickOnTopProgressBar(screen);
    expectPackageInPackagePanel(screen, 'React', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'React');

    clickOnTopProgressBar(screen);
    expectPackageInPackagePanel(screen, 'React', 'Signals');
  });

  it('resolve button is shown and works', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { 'firstResource.js': 1 },
        'secondResource.js': 1,
        'thirdResource.js': 1,
      },

      externalAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '1.2.0',
            licenseText: 'Permission is not granted',
          },
          uuid_3: {
            packageName: 'JQuery',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/folder1/firstResource.js': ['uuid_1', 'uuid_3'],
          '/secondResource.js': ['uuid_2'],
          '/thirdResource.js': ['uuid_1', 'uuid_2'],
        },
      },

      resolvedExternalAttributions: new Set<string>().add('uuid_1'),
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'folder1');
    expectPackageInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );
    expectPackageNotInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );

    clickOnPackageInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );
    clickOnButton(screen, 'resolve attribution');
    expectPackageNotInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');

    clickOnPackageInPackagePanel(
      screen,
      'Vue, 1.2.0',
      PackagePanelTitle.ExternalPackages,
    );
    clickOnButton(screen, 'resolve attribution');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    clickOnPackageInPackagePanel(
      screen,
      'Vue, 1.2.0',
      PackagePanelTitle.ExternalPackages,
    );
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnButton(screen, 'resolve attribution');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
  });

  it('resolve button is shown and works for merged signals', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { 'firstResource.js': 1 },
      },

      externalAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
          },
          uuid_2: {
            packageName: 'React',
            packageVersion: '16.5.0',
          },
          uuid_3: {
            packageName: 'Vue',
            packageVersion: '1.2.0',
            licenseText: 'Permission is not granted',
          },
          uuid_4: {
            packageName: 'JQuery',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/folder1/firstResource.js': ['uuid_1', 'uuid_2', 'uuid_3'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'folder1');
    expectPackageInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );
    expectPackageInPackagePanel(
      screen,
      'Vue, 1.2.0',
      PackagePanelTitle.ContainedExternalPackages,
    );

    clickOnPackageInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );
    clickOnButton(screen, 'resolve attribution');
    expectPackageNotInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages,
    );

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');

    clickOnPackageInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ExternalPackages,
    );
    clickOnButton(screen, 'resolve attribution');

    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
  });

  it('replaces attributions', () => {
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_2: {
          comment: 'ManualPackage',
          packageName: 'React',
          packageVersion: '16.0.0',
          attributionConfidence: DiscreteConfidence.High,
        },
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_2'],
        '/root/src/file_2': ['uuid_2'],
      },
    };
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        attributionConfidence: DiscreteConfidence.Low,
      },
      uuid_2: {
        packageName: 'React',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        attributionConfidence: DiscreteConfidence.High,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/file_1': ['uuid_1'],
      '/root/src/file_2': ['uuid_2'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'root');
    clickOnElementInResourceBrowser(screen, 'src');
    clickOnElementInResourceBrowser(screen, 'file_1');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'jQuery',
    );

    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.UnmarkForReplacement,
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkForReplacement);
    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.MarkForReplacement,
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.UnmarkForReplacement);
    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.UnmarkForReplacement,
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkForReplacement);

    clickOnElementInResourceBrowser(screen, 'file_2');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Cancel);
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'file_1');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'jQuery',
    );

    clickOnElementInResourceBrowser(screen, 'file_2');
    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Replace);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'file_1');
    expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    // make sure resources are now linked to React attribution
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
  });

  it('preferred button is shown and sets an attribution as preferred if QA mode is enabled', () => {
    function getExpectedSaveFileArgs(
      preferred: boolean,
      preferredOverOriginIds?: Array<string>,
    ): SaveFileArgs {
      const packageInfo = preferred
        ? {
            packageName: 'jQuery',
            packageVersion: '16.0.0',
            attributionConfidence: DiscreteConfidence.Low,
            preferred,
            preferredOverOriginIds,
          }
        : {
            packageName: 'jQuery',
            packageVersion: '16.0.0',
            attributionConfidence: DiscreteConfidence.Low,
          };
      return {
        manualAttributions: {
          uuid: packageInfo,
        },
        resolvedExternalAttributions: new Set<string>(),
        resourcesToAttributions: {
          '/file': ['uuid'],
        },
      };
    }

    const testResources: Resources = {
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        attributionConfidence: DiscreteConfidence.Low,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file': ['uuid'],
    };

    const testExternalAttributions = {
      uuid2: {
        originIds: ['originUuid'],
        source: { name: 'SC', documentConfidence: 100 },
      },
    };
    const testResourcesToExternalAttributions = {
      '/file': ['uuid2'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributionSources: {
          SC: {
            name: 'ScanCode',
            priority: 1,
            isRelevantForPreferred: true,
          },
        },
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );
    const testStore = createTestAppStore();
    renderComponentWithStore(<App />, { store: testStore });
    testStore.dispatch(setQAMode(true));
    clickOnButton(screen, ButtonText.Close);

    clickOnElementInResourceBrowser(screen, 'file');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'jQuery',
    );

    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.UnmarkAsPreferred);

    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkAsPreferred);
    clickOnButton(screen, ButtonText.Save);
    expect(window.electronAPI.saveFile).toHaveBeenNthCalledWith(
      1,
      getExpectedSaveFileArgs(true, ['originUuid']),
    );

    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.MarkAsPreferred);

    clickOnButtonInHamburgerMenu(screen, ButtonText.UnmarkAsPreferred);
    clickOnButton(screen, ButtonText.Save);
    expect(window.electronAPI.saveFile).toHaveBeenNthCalledWith(
      2,
      getExpectedSaveFileArgs(false, undefined),
    );

    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.UnmarkAsPreferred);

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(2);
  });

  it('after setting an attribution to preferred in QA mode, global save is disabled', () => {
    const testResources: Resources = {
      file: 1,
      other_file: 1,
      other_file_2: 1,
    };
    const testManualAttributions: Attributions = {
      uuid: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        attributionConfidence: DiscreteConfidence.Low,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file': ['uuid'],
      '/other_file': ['uuid'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributionSources: {
          SC: {
            name: 'ScanCode',
            priority: 1,
            isRelevantForPreferred: true,
          },
        },
      }),
    );
    const testStore = createTestAppStore();
    renderComponentWithStore(<App />, { store: testStore });
    testStore.dispatch(setQAMode(true));
    clickOnButton(screen, ButtonText.Close);

    clickOnElementInResourceBrowser(screen, 'file');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'jQuery',
    );

    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkAsPreferred);
    expect(getButton(screen, ButtonText.SaveGlobally)).toBeDisabled();
  });

  it('removes was-preferred field when user has saved unsaved changes and navigates away', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'something.js': 1,
        'something-else.js': 1,
        'something-special.js': 1,
        'something-extra.js': 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
            wasPreferred: true,
          },
          uuid_2: {
            packageName: 'License XY',
            licenseText: 'Permission is hereby granted was well',
            wasPreferred: true,
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
          '/something-else.js': ['uuid_1'],
          '/something-special.js': ['uuid_1'],
          '/something-extra.js': ['uuid_2'],
        },
      },
    };

    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'something.js');
    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );

    clickOnButton(screen, ButtonText.Save);
    expectModifyWasPreferredPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Cancel);
    expectAttributionIsMarkedAsWasPreferred(screen);

    clickOnButton(screen, ButtonText.SaveGlobally);
    expectModifyWasPreferredPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Cancel);
    expectAttributionIsMarkedAsWasPreferred(screen);

    clickOnButton(screen, ButtonText.Save);
    expectModifyWasPreferredPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Save);
    expectNoAttributionIsMarkedAsWasPreferred(screen);

    clickOnElementInResourceBrowser(screen, 'something-special.js');
    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Some special Name',
    );
    goToView(screen, View.Attribution);
    expectUnsavedChangesPopupIsShown(screen);
    clickOnButton(screen, ButtonText.SaveGlobally);
    expectModifyWasPreferredPopupIsShown(screen);
    clickOnButton(screen, ButtonText.SaveGlobally);
    expectAttributionIsMarkedAsWasPreferred(screen);
  });
});
