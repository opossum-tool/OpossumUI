// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  clickOnButton,
  expectValuesInTopProgressbarTooltip,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronBackend,
} from '../../../test-helpers/general-test-helpers';
import { App } from '../../../Components/App/App';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  clickOnButtonInPackageContextMenu,
  clickOnButtonInPackageInPackagePanelContextMenu,
  expectContextMenuForExternalAttributionInPackagePanel,
  expectContextMenuForNotPreSelectedAttributionMultipleResources,
  expectContextMenuForPreSelectedAttributionMultipleResources,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  expectGlobalOnlyContextMenuForPreselectedAttribution,
} from '../../../test-helpers/context-menu-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ButtonText, View } from '../../../enums/enums';
import { screen } from '@testing-library/react';
import React from 'react';
import {
  clickOnCardInAttributionList,
  clickOnTab,
  expectPackageInPackagePanel,
  expectPackagePanelShown,
} from '../../../test-helpers/package-panel-helpers';
import {
  expectValueInTextBox,
  expectValueNotInTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';
import {
  clickOnNodeInPopupWithResources,
  expectConfirmDeletionPopupNotVisible,
  expectConfirmDeletionPopupVisible,
  expectShowResourcesPopupVisible,
} from '../../../test-helpers/popup-test-helpers';

describe('The ContextMenu', () => {
  describe('deletion buttons', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
      'thirdResource.js': 1,
      'fourthResource.js': 1,
      'fifthResource.js': 1,
    };
    const testExpandedManualAttributions: Attributions = {
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

    it('work correctly for non-pre-selected attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testExpandedManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      expectValueInTextBox(screen, 'Name', 'Angular');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 5, 0, 0);
      expectContextMenuForNotPreSelectedAttributionMultipleResources(
        screen,
        'Angular, 12.2.8'
      );
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
      expectContextMenuForNotPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.5.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.Delete
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);
      expectValueNotInTextBox(screen, 'Name', 'React');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 4, 0, 0);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');
      expectContextMenuForNotPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.5.0'
      );

      clickOnElementInResourceBrowser(screen, 'fourthResource.js');
      expectValueInTextBox(screen, 'Name', 'Vue');
      clickOnTab(screen, 'Global Tab');

      expectGlobalOnlyContextMenuForNotPreselectedAttribution(
        screen,
        'React, 16.5.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 2, 0, 0);

      clickOnElementInResourceBrowser(screen, 'thirdResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');

      goToView(screen, View.Attribution);
      expectResourceBrowserIsNotShown(screen);

      expectGlobalOnlyContextMenuForNotPreselectedAttribution(
        screen,
        'Vue, 1.2.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'Vue, 1.2.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupVisible(screen);
      clickOnButton(screen, ButtonText.Confirm);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 0, 0, 0);
    });

    it('work correctly for pre-selected attributions', () => {
      const testManualAttributionsPreSelected = {
        ...testExpandedManualAttributions,
        uuid_1: {
          ...testExpandedManualAttributions.uuid_1,
          preSelected: true,
        },
        uuid_2: {
          ...testExpandedManualAttributions.uuid_2,
          preSelected: true,
        },
        uuid_3: {
          ...testExpandedManualAttributions.uuid_3,
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
      expectContextMenuForPreSelectedAttributionMultipleResources(
        screen,
        'Angular, 12.2.8'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'Angular, 12.2.8',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);
      expectValueNotInTextBox(screen, 'Name', 'Angular');

      clickOnCardInAttributionList(screen, 'React, 16.5.0');
      expectValueInTextBox(screen, 'Name', 'React');
      expectContextMenuForPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.5.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.Delete
      );
      expectConfirmDeletionPopupNotVisible(screen);
      expectValueNotInTextBox(screen, 'Name', 'React');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 0, 4, 0);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueInTextBox(screen, 'Name', 'React');
      expectContextMenuForPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.5.0'
      );

      clickOnElementInResourceBrowser(screen, 'fourthResource.js');
      expectValueInTextBox(screen, 'Name', 'Vue');
      clickOnTab(screen, 'Global Tab');
      expectGlobalOnlyContextMenuForPreselectedAttribution(
        screen,
        'React, 16.5.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);

      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 0, 2, 0);

      clickOnElementInResourceBrowser(screen, 'thirdResource.js');
      expectValueNotInTextBox(screen, 'Name', 'React');

      goToView(screen, View.Attribution);
      expectResourceBrowserIsNotShown(screen);

      expectGlobalOnlyContextMenuForPreselectedAttribution(
        screen,
        'Vue, 1.2.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'Vue, 1.2.0',
        ButtonText.DeleteGlobally
      );
      expectConfirmDeletionPopupNotVisible(screen);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expectValuesInTopProgressbarTooltip(screen, 5, 0, 0, 0);
    });
  });

  it('show resource button opens working popup with resources tree when clicking on show resources icon', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
    };

    const testExternalAttributions: Attributions = {
      uuid_ext_1: {
        packageName: 'JQuery',
        packageVersion: '16.5.0',
        licenseText: 'Permission is hereby granted',
      },
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_ext_1'],
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
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_1'],
    };

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
    expectContextMenuForExternalAttributionInPackagePanel(
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
    clickOnNodeInPopupWithResources(screen, 'folder1');

    expectPackageInPackagePanel(screen, 'JQuery, 16.5.0', 'Signals');

    expectContextMenuForNotPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0'
    );
    clickOnButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnNodeInPopupWithResources(screen, 'thirdResource.js');

    expectValueInTextBox(screen, 'Name', 'React');

    clickOnTab(screen, 'Global Tab');
    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'Vue, 1.2.0'
    );
    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnNodeInPopupWithResources(screen, 'secondResource.js');

    expectValueInTextBox(screen, 'Name', 'Vue');

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'Vue, 1.2.0'
    );
    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.ShowResources
    );
    expectShowResourcesPopupVisible(screen);
    clickOnNodeInPopupWithResources(screen, 'secondResource.js');

    expectValueInTextBox(screen, 'Name', 'Vue');
  });
});
