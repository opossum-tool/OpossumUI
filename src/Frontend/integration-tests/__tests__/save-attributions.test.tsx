// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import { ParsedFileContent, SaveFileArgs } from '../../../shared/shared-types';
import { ButtonText, DiscreteConfidence, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickAddNewAttributionButton,
  clickOnButton,
  clickOnButtonInContextMenu,
  clickOnElementInResourceBrowser,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  expectButtonInContextMenu,
  expectButtonInContextMenuIsNotShown,
  expectButtonIsNotShown,
  expectElementsInAutoCompleteAndSelectFirst,
  expectResourceBrowserIsNotShown,
  expectValueInManualPackagePanel,
  expectValueInTextBox,
  expectValueNotInTextBox,
  expectValuesInProgressbarTooltip,
  goToView,
  insertValueIntoTextBox,
  mockElectronIpcRendererOn,
  selectConfidenceInDropdown,
  TEST_TIMEOUT,
} from '../../test-helpers/test-helpers';
import { App } from '../../Components/App/App';

let originalIpcRenderer: IpcRenderer;

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

  test('saves new attributions to file in AuditView', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document.createRange = (): unknown => ({
      setStart: (): void => {},
      setEnd: (): void => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
    });

    const testPackageName = 'React';
    const testLicenseNames = ['MIT', 'MIT License'];
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
        texts: { MIT: 'MIT License Text', 'MIT License': 'MIT License Text' },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'something.js');
    expectValueInTextBox(screen, 'Name', 'InitialPackageName');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInContextMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, false);
    expectButtonInContextMenu(screen, ButtonText.Undo, false);

    clickOnButtonInContextMenu(screen, ButtonText.Undo);
    expectValueNotInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInContextMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);

    selectConfidenceInDropdown(screen, `Low (${DiscreteConfidence.Low})`);
    expect(
      screen.queryAllByText(`Low (${DiscreteConfidence.Low})`).length
    ).toBeTruthy();
    expectButton(screen, ButtonText.Save, false);
    expectButtonInContextMenu(screen, ButtonText.Undo, false);
    expectElementsInAutoCompleteAndSelectFirst(screen, testLicenseNames);

    clickOnButton(screen, ButtonText.Save);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: {
          licenseName: 'MIT',
          attributionConfidence: 20,
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

    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);

    expectButton(screen, ButtonText.Save, true);
    expectButtonInContextMenu(screen, ButtonText.Undo, true);
  });

  test('save and save for all buttons are shown and work', () => {
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
    expectButtonInContextMenu(screen, ButtonText.Undo, true);
    expectButton(screen, ButtonText.SaveForAll, true);

    insertValueIntoTextBox(screen, 'Name', 'Typescript');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInContextMenu(screen, ButtonText.Undo, false);
    expectButton(screen, ButtonText.SaveForAll, false);

    clickOnButton(screen, ButtonText.SaveForAll);
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInContextMenu(screen, ButtonText.Undo, true);
    expectButton(screen, ButtonText.SaveForAll, true);

    insertValueIntoTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Name', 'Vue');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInContextMenu(screen, ButtonText.Undo, false);
    expectButton(screen, ButtonText.SaveForAll, false);

    clickOnButton(screen, ButtonText.Save);
    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'Typescript');

    clickAddNewAttributionButton(screen);

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInContextMenu(screen, ButtonText.Undo, false);

    clickOnButton(screen, ButtonText.Save);

    expectValueInManualPackagePanel(screen, 'Angular');
    expectValueInManualPackagePanel(screen, 'Typescript, 16.5.0');
  });

  test('confirm buttons are shown and work', () => {
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
    expectValueInTextBox(screen, 'Confidence', '10');
    expectValuesInProgressbarTooltip(screen, 4, 0, 4, 0);
    expectButton(screen, ButtonText.Confirm);
    expectButton(screen, ButtonText.ConfirmForAll);

    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Confidence', '10');
    expectValueInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectValuesInProgressbarTooltip(screen, 4, 1, 3, 0);
    expectButtonInContextMenuIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmForAll);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInTextBox(screen, 'Confidence', '10');
    expectValueNotInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectButton(screen, ButtonText.Confirm);
    expectButton(screen, ButtonText.ConfirmForAll);

    clickOnButton(screen, 'Confirm for all');
    expectValueNotInTextBox(screen, 'Confidence', '10');
    expectValueInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectValuesInProgressbarTooltip(screen, 4, 3, 1, 0);
    expectButtonInContextMenuIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmForAll);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(screen, 'Confidence', '10');
    expectValueInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectButtonIsNotShown(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmForAll);

    clickOnElementInResourceBrowser(screen, 'fourthResource.js');
    expectValueInTextBox(screen, 'Confidence', '90');
    expectValueNotInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectValueInTextBox(screen, 'Name', 'Vue');
    expectButton(screen, ButtonText.Confirm);
    expectButtonIsNotShown(screen, ButtonText.ConfirmForAll);

    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Confidence', '90');
    expectValueInTextBox(
      screen,
      'Confidence',
      `High (${DiscreteConfidence.High})`
    );
    expectValuesInProgressbarTooltip(screen, 4, 4, 0, 0);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
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
    expectValueInTextBox(screen, 'Confidence', '10');
    expectValuesInProgressbarTooltip(screen, 5, 5, 0, 0);

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenu(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.Delete);
    expectButton(screen, ButtonText.Confirm);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 4, 0, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenu(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.DeleteForAll);
    expectButton(screen, ButtonText.Confirm);
    clickOnButton(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 2, 0, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectButtonInContextMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenuIsNotShown(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.Delete);
    expectButton(screen, ButtonText.Confirm);
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
    expectValueInTextBox(screen, 'Confidence', '10');
    expectValuesInProgressbarTooltip(screen, 5, 0, 5, 0);

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenu(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 0, 4, 0);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'React');

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenu(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.DeleteForAll);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectValuesInProgressbarTooltip(screen, 5, 0, 2, 0);

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInTextBox(screen, 'Name', 'React');
    expectButtonInContextMenuIsNotShown(screen, ButtonText.Delete);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Vue, 1.2.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonInContextMenuIsNotShown(screen, ButtonText.DeleteForAll);

    clickOnButtonInContextMenu(screen, ButtonText.Delete);
    expectButtonIsNotShown(screen, ButtonText.Confirm);
    expectValuesInProgressbarTooltip(screen, 5, 0, 0, 0);
  });
});
