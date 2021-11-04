// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { ButtonText, DiscreteConfidence, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnButton,
  clickOnButtonInPackageContextMenu,
  clickOnButtonInPackageInPackagePanelContextMenu,
  clickOnCardInAttributionList,
  clickOnElementInResourceBrowser,
  clickOnPathInPopupWithResources,
  clickOnTab,
  expectConfirmDeletionPopupNotVisible,
  expectConfirmDeletionPopupVisible,
  expectContextMenuIsNotShown,
  expectCorrectButtonsInContextMenu,
  expectNoConfirmationButtonsShown,
  expectPackageInPackagePanel,
  expectPackagePanelShown,
  expectResourceBrowserIsNotShown,
  expectShowResourcesPopupVisible,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
  expectValueNotInTextBox,
  expectValuesInProgressbarTooltip,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../test-helpers/test-helpers';
import { App } from '../../Components/App/App';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

const testResources: Resources = {
  folder1: { 'firstResource.js': 1 },
  'secondResource.js': 1,
  'thirdResource.js': 1,
};

const testResourcesToExternalAttributions: ResourcesToAttributions = {
  '/folder1/': ['uuid_ext_1'],
};

const testExternalAttributions: Attributions = {
  uuid_ext_1: {
    packageName: 'JQuery',
    packageVersion: '16.5.0',
    licenseText: 'Permission is hereby granted',
  },
};

const testManualAttributions: Attributions = {
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
};

const testManualAttributionsPreSelected: Attributions = {
  ...testManualAttributions,
  uuid_1: {
    ...testManualAttributions.uuid_1,
    preSelected: true,
  },
  uuid_2: {
    ...testManualAttributions.uuid_2,
    preSelected: true,
  },
};

const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/folder1/': ['uuid_1'],
  '/secondResource.js': ['uuid_2'],
  '/thirdResource.js': ['uuid_1'],
};

describe('The ContextMenu in audit view', () => {
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

  test('is shown correctly for external attributions in the signals tab', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      })
    );

    renderComponentWithStore(<App />);
    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabel = 'JQuery, 16.5.0';
    expectCorrectButtonsInContextMenu(
      screen,
      cardLabel,
      [ButtonText.ShowResources],
      [
        ButtonText.Delete,
        ButtonText.DeleteGlobally,
        ButtonText.Confirm,
        ButtonText.ConfirmGlobally,
      ]
    );
  });

  describe('in the ManualPackagePanel', () => {
    test('is shown correctly for preselected manual attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributionsPreSelected,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'folder1');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelMultipleResources,
        [
          ButtonText.ShowResources,
          ButtonText.Delete,
          ButtonText.DeleteGlobally,
          ButtonText.Confirm,
          ButtonText.ConfirmGlobally,
        ],
        [ButtonText.Hide]
      );

      clickOnElementInResourceBrowser(screen, 'secondResource.js');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelSingleResource,
        [ButtonText.ShowResources, ButtonText.Delete, ButtonText.Confirm],
        [ButtonText.Hide, ButtonText.DeleteGlobally, ButtonText.ConfirmGlobally]
      );
    });

    test('is shown correctly for not preselected manual attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'folder1');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelMultipleResources,
        [
          ButtonText.ShowResources,
          ButtonText.Delete,
          ButtonText.DeleteGlobally,
        ],
        [ButtonText.Hide, ButtonText.Confirm, ButtonText.ConfirmGlobally]
      );

      clickOnElementInResourceBrowser(screen, 'secondResource.js');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelSingleResource,
        [ButtonText.ShowResources, ButtonText.Delete],
        [
          ButtonText.Hide,
          ButtonText.Confirm,
          ButtonText.ConfirmGlobally,
          ButtonText.DeleteGlobally,
        ]
      );
    });

    test('is not shown for add new attribution', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'folder1');

      const cardLabel = 'Add new attribution';
      expectContextMenuIsNotShown(screen, cardLabel);
    });
  });

  describe('in the all attributions panel', () => {
    test('is shown correctly for preselected manual Attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributionsPreSelected,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelMultipleResources
      );

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelSingleResource
      );
    });

    test('is shown correctly for not preselected manual attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelMultipleResources
      );

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelSingleResource
      );
    });
  });

  describe('in the attributions in folder content panel', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1, 'secondResource.js': 1 },
      'thirdResource.js': 1,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/firstResource.js': ['uuid_1'],
      '/folder1/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_1'],
    };

    test('is shown correctly for preselected manual attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributionsPreSelected,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'folder1');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelMultipleResources
      );

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelSingleResource
      );
    });

    test('is shown correctly for not preselected manual attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'folder1');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelMultipleResources
      );

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelSingleResource
      );
    });
  });
});

describe('The ContextMenu in Attribution View', () => {
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

  test('is shown correctly for preselected manual attributions', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributionsPreSelected,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);
    goToView(screen, View.Attribution);

    const cardLabelMultipleResources = 'React, 16.5.0';
    expectCorrectGlobalOnlyButtonsPreselectedAttribution(
      cardLabelMultipleResources
    );

    const cardLabelSingleResource = 'Vue, 1.2.0';
    expectCorrectGlobalOnlyButtonsPreselectedAttribution(
      cardLabelSingleResource
    );
  });

  test('is shown correctly for not preselected manual attributions', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);
    goToView(screen, View.Attribution);

    const cardLabelMultipleResources = 'React, 16.5.0';
    expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
      cardLabelMultipleResources
    );

    const cardLabelSingleResource = 'Vue, 1.2.0';
    expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
      cardLabelSingleResource
    );
  });
});

describe('The ContextMenu', () => {
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

  describe('deletion buttons', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
      'thirdResource.js': 1,
      'fourthResource.js': 1,
      'fifthResource.js': 1,
    };
    const testManualAttributions: Attributions = {
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
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '12.2.8',
        licenseText: 'Permission is not granted',
        comment: 'Attribution of one resources',
        attributionConfidence: 90,
      },
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/firstResource.js': ['uuid_1', 'uuid_3'],
      '/secondResource.js': ['uuid_1'],
      '/thirdResource.js': ['uuid_1'],
      '/fourthResource.js': ['uuid_2', 'uuid_3'],
      '/fifthResource.js': ['uuid_2'],
    };

    test('work correctly for non-pre-selected attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      expectValueInTextBox(screen, 'Name', 'Angular');
      expectValuesInProgressbarTooltip(screen, 5, 5, 0, 0);
      clickOnButtonInPackageContextMenu(
        screen,
        'Angular, 12.2.8',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);
      expectValueNotInTextBox(screen, 'Name', 'Angular');

      clickOnCardInAttributionList(screen, 'React, 16.5.0');
      expectValueInTextBox(screen, 'Name', 'React');
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.Delete
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);
      expectValueNotInTextBox(screen, 'Name', 'React');
      expectValuesInProgressbarTooltip(screen, 5, 4, 0, 0);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');

      clickOnElementInResourceBrowser(screen, 'fourthResource.js');
      expectValueInTextBox(screen, 'Name', 'Vue');
      clickOnTab(screen, 'All Attributions Tab');
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');
      expectValuesInProgressbarTooltip(screen, 5, 2, 0, 0);

      clickOnElementInResourceBrowser(screen, 'thirdResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');

      goToView(screen, View.Attribution);
      expectResourceBrowserIsNotShown(screen);

      clickOnButtonInPackageContextMenu(
        screen,
        'Vue, 1.2.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);
      expectValuesInProgressbarTooltip(screen, 5, 0, 0, 0);
    });

    test('work correctly for pre-selected attributions', () => {
      const testManualAttributionsPreSelected = {
        ...testManualAttributions,
        uuid_1: {
          ...testManualAttributions.uuid_1,
          preSelected: true,
        },
        uuid_2: {
          ...testManualAttributions.uuid_2,
          preSelected: true,
        },
        uuid_3: {
          ...testManualAttributions.uuid_3,
          preSelected: true,
        },
      };

      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributionsPreSelected,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      expectValueInTextBox(screen, 'Name', 'Angular');
      clickOnButtonInPackageContextMenu(
        screen,
        'Angular, 12.2.8',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);
      expectValueNotInTextBox(screen, 'Name', 'Angular');

      clickOnCardInAttributionList(screen, 'React, 16.5.0');
      expectValueInTextBox(screen, 'Name', 'React');
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.Delete
      );
      expectConfirmDeletionPopupNotVisible(screen);
      expectValueNotInTextBox(screen, 'Name', 'React');
      expectValuesInProgressbarTooltip(screen, 5, 0, 4, 0);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');

      clickOnElementInResourceBrowser(screen, 'fourthResource.js');
      expectValueInTextBox(screen, 'Name', 'Vue');
      clickOnTab(screen, 'All Attributions Tab');
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');
      expectValuesInProgressbarTooltip(screen, 5, 0, 2, 0);

      clickOnElementInResourceBrowser(screen, 'thirdResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');

      goToView(screen, View.Attribution);
      expectResourceBrowserIsNotShown(screen);

      clickOnButtonInPackageContextMenu(
        screen,
        'Vue, 1.2.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);
      expectValuesInProgressbarTooltip(screen, 5, 0, 0, 0);
    });
  });

  test('show resource button opens working popup with file list when clicking on show resources icon', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      })
    );
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, '/');
    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      'Signals in Folder Content'
    );

    clickOnButtonInPackageInPackagePanelContextMenu(
      screen,
      'JQuery, 16.5.0',
      'Signals in Folder Content',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnPathInPopupWithResources(screen, '/folder1/');
    expectPackageInPackagePanel(screen, 'JQuery, 16.5.0', 'Signals');

    clickOnButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnPathInPopupWithResources(screen, '/thirdResource.js');
    expectValueInTextBox(screen, 'Name', 'React');

    clickOnTab(screen, 'All Attributions Tab');
    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnPathInPopupWithResources(screen, '/secondResource.js');
    expectValueInTextBox(screen, 'Name', 'Vue');

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnPathInPopupWithResources(screen, '/secondResource.js');
    expectValueInTextBox(screen, 'Name', 'Vue');
  });

  describe('confirmation buttons', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
      'thirdResource.js': 1,
      'fourthResource.js': 1,
    };

    const testManualAttributions: Attributions = {
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
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/firstResource.js': ['uuid_1'],
      '/secondResource.js': ['uuid_1'],
      '/thirdResource.js': ['uuid_1'],
      '/fourthResource.js': ['uuid_2'],
    };

    test('work correctly in audit view', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueInConfidenceField(screen, '10');
      expectValuesInProgressbarTooltip(screen, 4, 0, 4, 0);

      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.Confirm
      );
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectValuesInProgressbarTooltip(screen, 4, 1, 3, 0);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueInConfidenceField(screen, '10');
      expectValueNotInConfidenceField(
        screen,
        `High (${DiscreteConfidence.High})`
      );

      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.ConfirmGlobally
      );
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectValuesInProgressbarTooltip(screen, 4, 3, 1, 0);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

      clickOnElementInResourceBrowser(screen, 'thirdResource.js');
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

      clickOnTab(screen, 'All Attributions Tab');
      clickOnButtonInPackageContextMenu(
        screen,
        'Vue, 1.2.0',
        ButtonText.ConfirmGlobally
      );

      clickOnElementInResourceBrowser(screen, 'fourthResource.js');
      expectValueInTextBox(screen, 'Name', 'Vue');
      expectValueNotInConfidenceField(screen, '90');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectValuesInProgressbarTooltip(screen, 4, 4, 0, 0);
      expectNoConfirmationButtonsShown(screen, 'Vue, 1.2.0');
    });

    test('work correctly in Attribution View', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      goToView(screen, View.Attribution);
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.ConfirmGlobally
      );
      clickOnCardInAttributionList(screen, 'React, 16.5.0');
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

      goToView(screen, View.Audit);
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');
    });
  });
});

function expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [ButtonText.ShowResources, ButtonText.DeleteGlobally],
    [
      ButtonText.Hide,
      ButtonText.Delete,
      ButtonText.Confirm,
      ButtonText.ConfirmGlobally,
    ]
  );
}

function expectCorrectGlobalOnlyButtonsPreselectedAttribution(
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [
      ButtonText.ShowResources,
      ButtonText.DeleteGlobally,
      ButtonText.ConfirmGlobally,
    ],
    [ButtonText.Hide, ButtonText.Delete, ButtonText.Confirm]
  );
}
