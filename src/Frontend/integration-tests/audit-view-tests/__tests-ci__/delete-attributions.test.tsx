// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  EMPTY_PARSED_FILE_CONTENT,
  expectValuesInProgressbarTooltip,
  goToView,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { fireEvent, screen } from '@testing-library/react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ParsedFileContent } from '../../../../shared/shared-types';
import { ButtonText, View } from '../../../enums/enums';
import { IpcRenderer } from 'electron';
import React from 'react';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';
import {
  expectConfirmDeletionPopupNotVisible,
  expectConfirmDeletionPopupVisible,
} from '../../../test-helpers/popup-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.mock('../../../Components/ResourceDetailsTabs/get-new-accordion-worker');

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(
  mockFileLoadedChannelReturn: ParsedFileContent
): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(
        IpcChannel.FileLoaded,
        mockFileLoadedChannelReturn
      )
    );
}

describe('The App in Audit View', () => {
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

  test('delete buttons are shown and work for non-preselected with popup', () => {
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

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInConfidenceField(screen, '10');
    expectValuesInProgressbarTooltip(screen, 5, 5, 0, 0);

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 4, 0, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 2, 0, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupVisible(screen);
    clickOnButton(screen, ButtonText.Confirm);
    expectValuesInProgressbarTooltip(screen, 5, 0, 0, 0);
  });

  test('delete buttons are shown and work for preselected without popup', () => {
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

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInConfidenceField(screen, '10');
    expectValuesInProgressbarTooltip(screen, 5, 0, 5, 0);

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupNotVisible(screen);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 0, 4, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.DeleteGlobally);
    expectConfirmDeletionPopupNotVisible(screen);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 0, 2, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.DeleteGlobally);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Delete);
    expectConfirmDeletionPopupNotVisible(screen);
    expectValuesInProgressbarTooltip(screen, 5, 0, 0, 0);
  });
});
