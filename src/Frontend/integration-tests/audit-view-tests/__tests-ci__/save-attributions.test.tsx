// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  expectButtonIsNotShown,
  expectElementsInAutoCompleteAndSelectFirst,
  expectValuesInTopProgressbarTooltip,
  mockElectronBackend,
} from '../../../test-helpers/general-test-helpers';
import { screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  DiscreteConfidence,
  ParsedFileContent,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { ButtonText } from '../../../enums/enums';
import React from 'react';
import {
  clickAddNewAttributionButton,
  expectValueInManualPackagePanel,
} from '../../../test-helpers/package-panel-helpers';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
  selectConfidenceInDropdown,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

describe('The App in Audit View', () => {
  it('saves new attributions to file in AuditView', () => {
    const testPackageName = 'React';
    const testLicenseNames = [
      { shortName: 'MIT', fullName: 'MIT License' },
      {
        shortName: 'HaskellReport',
        fullName: 'Haskell Language Report License',
      },
    ];
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'something.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'InitialPackageName',
            packageVersion: '16.5.0',
            licenseText: 'Custom license text',
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
        },
      },

      frequentLicenses: {
        nameOrder: testLicenseNames,
        texts: {
          MIT: 'MIT License Text',
          HaskellReport: 'Haskell License Text',
        },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'something.js');
    expectValueInTextBox(screen, 'Name', 'InitialPackageName');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Undo);
    expectValueNotInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);

    selectConfidenceInDropdown(screen, `Low (${DiscreteConfidence.Low})`);
    expect(screen.queryAllByText(`Low (${DiscreteConfidence.Low})`).length);
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectElementsInAutoCompleteAndSelectFirst(screen, [
      'MIT - MIT License',
      'HaskellReport - Haskell Language Report License',
    ]);

    clickOnButton(screen, ButtonText.Save);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: {
          licenseName: 'MIT',
          attributionConfidence: DiscreteConfidence.Low,
          licenseText: 'Custom license text',
          packageName: 'React',
          packageVersion: '16.5.0',
        },
      },
      resourcesToAttributions: {
        '/something.js': ['uuid_1'],
      },
      resolvedExternalAttributions: new Set<string>(),
    };

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs
    );

    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
  });

  it('save and save for all buttons are shown and work', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
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
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
    expectButton(screen, ButtonText.SaveGlobally, true);

    insertValueIntoTextBox(screen, 'Name', 'Typescript');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectButton(screen, ButtonText.SaveGlobally, false);

    clickOnButton(screen, ButtonText.SaveGlobally);
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
    expectButton(screen, ButtonText.SaveGlobally, true);

    insertValueIntoTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Name', 'Vue');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectButton(screen, ButtonText.SaveGlobally, false);

    clickOnButton(screen, ButtonText.Save);
    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'Typescript');

    clickAddNewAttributionButton(screen);

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);

    clickOnButton(screen, ButtonText.Save);

    expectValueInManualPackagePanel(screen, 'Angular');
    expectValueInManualPackagePanel(screen, 'Typescript, 16.5.0');
  });

  it('confirm buttons are shown and work', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'firstResource.js': 1,
        'secondResource.js': 1,
        'thirdResource.js': 1,
        'fourthResource.js': 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
            comment: 'Attribution of multiple resources',
            attributionConfidence: 10,
            preSelected: true,
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '1.2.0',
            licenseText: 'Permission is not granted',
            comment: 'Attribution of one resources',
            attributionConfidence: 90,
            preSelected: true,
          },
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_1'],
          '/thirdResource.js': ['uuid_1'],
          '/fourthResource.js': ['uuid_2'],
        },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInConfidenceField(screen, '10');
    expectValuesInTopProgressbarTooltip(screen, 4, 0, 4, 0);
    expectButton(screen, ButtonText.Confirm);
    expectButton(screen, ButtonText.ConfirmGlobally);

    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectValuesInTopProgressbarTooltip(screen, 4, 1, 3, 0);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmGlobally);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInConfidenceField(screen, '10');
    expectValueNotInConfidenceField(
      screen,
      `High (${DiscreteConfidence.High})`
    );
    expectButton(screen, ButtonText.Confirm);
    expectButton(screen, ButtonText.ConfirmGlobally);

    clickOnButton(screen, ButtonText.ConfirmGlobally);
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectValuesInTopProgressbarTooltip(screen, 4, 3, 1, 0);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmGlobally);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmGlobally);

    clickOnElementInResourceBrowser(screen, 'fourthResource.js');
    expectValueInConfidenceField(screen, '90');
    expectValueNotInConfidenceField(
      screen,
      `High (${DiscreteConfidence.High})`
    );
    expectValueInTextBox(screen, 'Name', 'Vue');
    expectButton(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmGlobally);

    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInConfidenceField(screen, '90');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectValuesInTopProgressbarTooltip(screen, 4, 4, 0, 0);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
  });
});
