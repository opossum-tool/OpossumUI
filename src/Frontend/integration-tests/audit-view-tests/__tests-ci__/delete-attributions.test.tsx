// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { ParsedFileContent } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { App } from '../../../Components/App/App';
import { ButtonText, View } from '../../../enums/enums';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnButton,
  EMPTY_PARSED_FILE_CONTENT,
  expectValuesInTopProgressbarTooltip,
  goToView,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  expectConfirmDeletionPopupNotVisible,
  expectConfirmDeletionPopupVisible,
} from '../../../test-helpers/popup-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';

describe('The App in Audit View', () => {
  it('delete buttons are shown and work for non-preselected with popup', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'firstResource.js': 1,
        'secondResource.js': 1,
        'thirdResource.js': 1,
        'fourthResource.js': 1,
        'fifthResource.js': 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
            comment: 'Attribution of multiple resources',
            attributionConfidence: 10,
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '1.2.0',
            licenseText: 'Permission is not granted',
            comment: 'Attribution of one resources',
            attributionConfidence: 90,
          },
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_1'],
          '/thirdResource.js': ['uuid_1'],
          '/fourthResource.js': ['uuid_2'],
          '/fifthResource.js': ['uuid_2'],
        },
      },
    };

    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectValueInConfidenceField(screen, '10');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 5, 0, 0);

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 4, 0, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 2, 0, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 0, 0, 0);
  });

  it('delete buttons are shown and work for preselected without popup', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'firstResource.js': 1,
        'secondResource.js': 1,
        'thirdResource.js': 1,
        'fourthResource.js': 1,
        'fifthResource.js': 1,
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
          '/fifthResource.js': ['uuid_2'],
        },
      },
    };

    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectValueInConfidenceField(screen, '10');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 0, 5, 0);

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupNotVisible(screen);
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 0, 4, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);
    expectConfirmDeletionPopupNotVisible(screen);
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 0, 2, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupNotVisible(screen);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 5, 0, 0, 0);
  });
});
