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
import { ButtonText, View } from '../../../enums/enums';
import { setQAMode } from '../../../state/actions/view-actions/view-actions';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnButton,
  closeProjectStatisticsPopup,
  EMPTY_PARSED_FILE_CONTENT,
  expectAttributionIsMarkedAsWasPreferred,
  expectNoAttributionIsMarkedAsWasPreferred,
  getButton,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  expectModifyWasPreferredPopupIsShown,
  expectUnsavedChangesPopupIsShown,
} from '../../../test-helpers/popup-test-helpers';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

describe('The App in Audit View', () => {
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
