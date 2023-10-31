// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  Resources,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { App } from '../../../Components/App/App';
import { ButtonText } from '../../../enums/enums';
import { ADD_NEW_ATTRIBUTION_BUTTON_TEXT } from '../../../shared-constants';
import { setExternalAttributionsToHashes } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { addResolvedExternalAttribution } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnButtonInPackageContextMenu,
  clickOnButtonInPackageInPackagePanelContextMenu,
  expectContextMenuForExternalAttributionInPackagePanel,
  expectContextMenuForHiddenExternalAttributionInPackagePanel,
  expectContextMenuForNotPreSelectedAttributionMultipleResources,
  expectContextMenuForNotPreSelectedAttributionSingleResource,
  expectContextMenuForPreSelectedAttributionMultipleResources,
  expectContextMenuIsNotShown,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  expectGlobalOnlyContextMenuForPreselectedAttribution,
  expectNoConfirmationButtonsShown,
  handleReplaceMarkedAttributionViaContextMenu,
} from '../../../test-helpers/context-menu-test-helpers';
import {
  expectValuesInTopProgressbarTooltip,
  getParsedInputFileEnrichedWithTestData,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  clickOnPackageInPackagePanel,
  clickOnTab,
  expectAddIconInAddToAttributionCardIsHidden,
  expectAddIconInAddToAttributionCardIsNotHidden,
} from '../../../test-helpers/package-panel-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

const testResources: Resources = {
  folder1: { 'firstResource.js': 1 },
  'secondResource.js': 1,
  'thirdResource.js': 1,
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

describe('In Audit View the ContextMenu', () => {
  it('is not shown for add new attribution PackageCard', () => {
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    renderComponentWithStore(<App />);
    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabel = ADD_NEW_ATTRIBUTION_BUTTON_TEXT;
    expectContextMenuIsNotShown(screen, cardLabel);
  });

  it('confirmation buttons work correctly', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
      'thirdResource.js': 1,
      'fourthResource.js': 1,
    };

    const testManualAttributionsPreSelected: Attributions = {
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
      '/firstResource.js': ['uuid_1'],
      '/secondResource.js': ['uuid_1'],
      '/thirdResource.js': ['uuid_1'],
      '/fourthResource.js': ['uuid_2'],
    };
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributionsPreSelected,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectValueInConfidenceField(screen, '10');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 4, 0, 4, 0);
    expectContextMenuForPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0',
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.Confirm,
    );
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 4, 1, 3, 0);
    expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'React',
    );
    expectValueInConfidenceField(screen, '10');
    expectValueNotInConfidenceField(
      screen,
      `High (${DiscreteConfidence.High})`,
    );
    expectContextMenuForPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0',
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.ConfirmGlobally,
    );
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 4, 3, 1, 0);
    expectContextMenuForNotPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0',
    );

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectContextMenuForNotPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0',
    );

    clickOnTab(screen, 'Global Tab');
    expectGlobalOnlyContextMenuForPreselectedAttribution(screen, 'Vue, 1.2.0');
    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.ConfirmGlobally,
    );

    clickOnElementInResourceBrowser(screen, 'fourthResource.js');
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.packageName,
      'Vue',
    );
    expectValueNotInConfidenceField(screen, '90');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expectValuesInTopProgressbarTooltip(screen, 4, 4, 0, 0);

    expectContextMenuForNotPreSelectedAttributionSingleResource(
      screen,
      'Vue, 1.2.0',
    );
  });

  it('hide / unhide buttons work correctly', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/firstResource.js': ['uuid_1', 'uuid_2'],
      '/secondResource.js': ['uuid_2'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testManualAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );
    const { store } = renderComponentWithStore(<App />);
    store.dispatch(addResolvedExternalAttribution('uuid_1'));

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );

    clickOnButtonInPackageInPackagePanelContextMenu(
      screen,
      'Vue, 1.2.0',
      'Signals',
      ButtonText.Hide,
    );
    expectContextMenuForHiddenExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    clickOnPackageInPackagePanel(screen, 'Vue, 1.2.0', 'Signals');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnButtonInPackageInPackagePanelContextMenu(
      screen,
      'Vue, 1.2.0',
      'Signals',
      ButtonText.Unhide,
    );
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
  });

  it('hide / unhide works correctly for merged signals', () => {
    const testResources: Resources = {
      'firstResource.js': 1,
      'secondResource.js': 1,
    };
    const testExternalAttributions: Attributions = {
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
      },
    };
    const testExternalAttributionsToHashes = {
      uuid_1: 'a',
      uuid_2: 'a',
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/firstResource.js': ['uuid_1', 'uuid_2', 'uuid_3'],
      '/secondResource.js': ['uuid_1', 'uuid_2', 'uuid_3'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );
    const { store } = renderComponentWithStore(<App />);
    store.dispatch(
      setExternalAttributionsToHashes(testExternalAttributionsToHashes),
    );

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');

    clickOnButtonInPackageInPackagePanelContextMenu(
      screen,
      'React, 16.5.0',
      'Signals',
      ButtonText.Hide,
    );
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
    expectContextMenuForHiddenExternalAttributionInPackagePanel(
      screen,
      'React, 16.5.0',
      'Signals',
    );
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
    expectContextMenuForHiddenExternalAttributionInPackagePanel(
      screen,
      'React, 16.5.0',
      'Signals',
    );
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );

    clickOnButtonInPackageInPackagePanelContextMenu(
      screen,
      'React, 16.5.0',
      'Signals',
      ButtonText.Unhide,
    );
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'React, 16.5.0',
      'Signals',
    );
    expectContextMenuForExternalAttributionInPackagePanel(
      screen,
      'Vue, 1.2.0',
      'Signals',
    );
  });

  describe('replaces attributions', () => {
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_2: {
          comment: 'ManualPackage',
          packageName: 'React',
          packageVersion: '16.0.0',
          attributionConfidence: DiscreteConfidence.Low,
        },
        uuid_3: {
          packageName: 'Vue',
          packageVersion: '16.0.0',
          comment: 'ManualPackage',
          preSelected: true,
          attributionConfidence: DiscreteConfidence.Low,
        },
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_2'],
        '/root/src/file_2': ['uuid_2', 'uuid_3'],
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
        attributionConfidence: DiscreteConfidence.Low,
      },
      uuid_3: {
        packageName: 'Vue',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        preSelected: true,
        attributionConfidence: DiscreteConfidence.Low,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/file_1': ['uuid_1'],
      '/root/src/file_2': ['uuid_2', 'uuid_3'],
    };

    it('in the package panel', () => {
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

      clickOnButtonInPackageContextMenu(
        screen,
        'jQuery, 16.0.0',
        ButtonText.MarkForReplacement,
      );
      clickOnElementInResourceBrowser(screen, 'file_2');

      handleReplaceMarkedAttributionViaContextMenu(
        screen,
        'React, 16.0.0',
        ButtonText.Cancel,
      );

      clickOnElementInResourceBrowser(screen, 'file_1');
      expectValueInTextBox(
        screen,
        text.attributionColumn.packageSubPanel.packageName,
        'jQuery',
      );

      clickOnElementInResourceBrowser(screen, 'file_2');
      handleReplaceMarkedAttributionViaContextMenu(
        screen,
        'React, 16.0.0',
        ButtonText.Replace,
      );
      expectValueInTextBox(
        screen,
        text.attributionColumn.packageSubPanel.packageName,
        'React',
      );
      expectContextMenuForNotPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.0.0',
      );

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

    it('in the attributions in folder content panel', () => {
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
      clickOnButtonInPackageContextMenu(
        screen,
        'jQuery, 16.0.0',
        ButtonText.MarkForReplacement,
      );

      handleReplaceMarkedAttributionViaContextMenu(
        screen,
        'React, 16.0.0',
        ButtonText.Cancel,
      );

      expect(screen.queryByText('jQuery, 16.0.0'));

      handleReplaceMarkedAttributionViaContextMenu(
        screen,
        'React, 16.0.0',
        ButtonText.Replace,
      );

      expectGlobalOnlyContextMenuForNotPreselectedAttribution(
        screen,
        'React, 16.0.0',
      );
      expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();

      // make sure resources are now linked to React attribution
      expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
        expectedSaveFileArgs,
      );
    });
  });
});
